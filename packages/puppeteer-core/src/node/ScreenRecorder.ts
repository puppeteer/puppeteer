/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {ChildProcessWithoutNullStreams} from 'child_process';
import {spawn, spawnSync} from 'child_process';
import {PassThrough} from 'stream';

import debug from 'debug';
import type Protocol from 'devtools-protocol';

import type {
  Observable,
  OperatorFunction,
} from '../../third_party/rxjs/rxjs.js';
import {
  bufferCount,
  concatMap,
  filter,
  from,
  fromEvent,
  lastValueFrom,
  map,
  takeUntil,
  tap,
} from '../../third_party/rxjs/rxjs.js';
import {CDPSessionEvent} from '../api/CDPSession.js';
import type {BoundingBox} from '../api/ElementHandle.js';
import type {Page} from '../api/Page.js';
import {debugError} from '../common/util.js';
import {guarded} from '../util/decorators.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

const CRF_VALUE = 30;
const DEFAULT_FPS = 30;

const debugFfmpeg = debug('puppeteer:ffmpeg');

/**
 * @internal
 */
export interface ScreenRecorderOptions {
  speed?: number;
  crop?: BoundingBox;
  format?: 'gif' | 'webm';
  scale?: number;
  path?: string;
}

/**
 * @public
 */
export class ScreenRecorder extends PassThrough {
  #page: Page;

  #process: ChildProcessWithoutNullStreams;

  #controller = new AbortController();
  #lastFrame: Promise<readonly [Buffer, number]>;

  /**
   * @internal
   */
  constructor(
    page: Page,
    width: number,
    height: number,
    {speed, scale, crop, format, path}: ScreenRecorderOptions = {}
  ) {
    super({allowHalfOpen: false});

    path ??= 'ffmpeg';

    // Tests if `ffmpeg` exists.
    const {error} = spawnSync(path);
    if (error) {
      throw error;
    }

    this.#process = spawn(
      path,
      // See https://trac.ffmpeg.org/wiki/Encode/VP9 for more information on flags.
      [
        ['-loglevel', 'error'],
        // Reduces general buffering.
        ['-avioflags', 'direct'],
        // Reduces initial buffering while analyzing input fps and other stats.
        [
          '-fpsprobesize',
          `${0}`,
          '-probesize',
          `${32}`,
          '-analyzeduration',
          `${0}`,
          '-fflags',
          'nobuffer',
        ],
        // Forces input to be read from standard input, and forces png input
        // image format.
        ['-f', 'image2pipe', '-c:v', 'png', '-i', 'pipe:0'],
        // Overwrite output and no audio.
        ['-y', '-an'],
        // This drastically reduces stalling when cpu is overbooked. By default
        // VP9 tries to use all available threads?
        ['-threads', '1'],
        // Specifies the frame rate we are giving ffmpeg.
        ['-framerate', `${DEFAULT_FPS}`],
        // Specifies the encoding and format we are using.
        this.#getFormatArgs(format ?? 'webm'),
        // Disable bitrate.
        ['-b:v', `${0}`],
        // Filters to ensure the images are piped correctly.
        [
          '-vf',
          `${
            speed ? `setpts=${1 / speed}*PTS,` : ''
          }crop='min(${width},iw):min(${height},ih):${0}:${0}',pad=${width}:${height}:${0}:${0}${
            crop ? `,crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}` : ''
          }${scale ? `,scale=iw*${scale}:-1` : ''}`,
        ],
        'pipe:1',
      ].flat(),
      {stdio: ['pipe', 'pipe', 'pipe']}
    );
    this.#process.stdout.pipe(this);
    this.#process.stderr.on('data', (data: Buffer) => {
      debugFfmpeg(data.toString('utf8'));
    });

    this.#page = page;

    const {client} = this.#page.mainFrame();
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.stop().catch(debugError);
    });

    this.#lastFrame = lastValueFrom(
      (
        fromEvent(
          client,
          'Page.screencastFrame'
        ) as Observable<Protocol.Page.ScreencastFrameEvent>
      ).pipe(
        tap(event => {
          void client.send('Page.screencastFrameAck', {
            sessionId: event.sessionId,
          });
        }),
        filter(event => {
          return event.metadata.timestamp !== undefined;
        }),
        map(event => {
          return {
            buffer: Buffer.from(event.data, 'base64'),
            timestamp: event.metadata.timestamp!,
          };
        }),
        bufferCount(2, 1) as OperatorFunction<
          {buffer: Buffer; timestamp: number},
          [
            {buffer: Buffer; timestamp: number},
            {buffer: Buffer; timestamp: number},
          ]
        >,
        concatMap(([{timestamp: previousTimestamp, buffer}, {timestamp}]) => {
          return from(
            Array<Buffer>(
              Math.round(DEFAULT_FPS * (timestamp - previousTimestamp))
            ).fill(buffer)
          );
        }),
        map(buffer => {
          void this.#writeFrame(buffer);
          return [buffer, performance.now()] as const;
        }),
        takeUntil(fromEvent(this.#controller.signal, 'abort'))
      ),
      {defaultValue: [Buffer.from([]), performance.now()] as const}
    );
  }

  #getFormatArgs(format: 'webm' | 'gif') {
    switch (format) {
      case 'webm':
        return [
          // Sets the codec to use.
          ['-c:v', 'vp9'],
          // Sets the format
          ['-f', 'webm'],
          // Sets the quality. Lower the better.
          ['-crf', `${CRF_VALUE}`],
          // Sets the quality and how efficient the compression will be.
          ['-deadline', 'realtime', '-cpu-used', `${8}`],
        ].flat();
      case 'gif':
        return [
          // Sets the frame rate and uses a custom palette generated from the
          // input.
          [
            '-vf',
            'fps=5,split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse',
          ],
          // Sets the format
          ['-f', 'gif'],
        ].flat();
    }
  }

  @guarded()
  async #writeFrame(buffer: Buffer) {
    const error = await new Promise<Error | null | undefined>(resolve => {
      this.#process.stdin.write(buffer, resolve);
    });
    if (error) {
      console.log(`ffmpeg failed to write: ${error.message}.`);
    }
  }

  /**
   * Stops the recorder.
   *
   * @public
   */
  @guarded()
  async stop(): Promise<void> {
    if (this.#controller.signal.aborted) {
      return;
    }
    // Stopping the screencast will flush the frames.
    await this.#page._stopScreencast().catch(debugError);

    this.#controller.abort();

    // Repeat the last frame for the remaining frames.
    const [buffer, timestamp] = await this.#lastFrame;
    await Promise.all(
      Array<Buffer>(
        Math.max(
          1,
          Math.round((DEFAULT_FPS * (performance.now() - timestamp)) / 1000)
        )
      )
        .fill(buffer)
        .map(this.#writeFrame.bind(this))
    );

    // Close stdin to notify FFmpeg we are done.
    this.#process.stdin.end();
    await new Promise(resolve => {
      this.#process.once('close', resolve);
    });
  }

  /**
   * @internal
   */
  async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
  }
}
