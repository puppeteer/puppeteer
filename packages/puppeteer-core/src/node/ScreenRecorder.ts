/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import {dirname} from 'node:path';
import {PassThrough} from 'node:stream';

import debug from 'debug';

import type {OperatorFunction} from '../../third_party/rxjs/rxjs.js';
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
import {
  type Page,
  ImageFormat,
  type FileFormat,
  type FilePath,
} from '../api/Page.js';
import {debugError, fromEmitterEvent} from '../common/util.js';
import {guarded} from '../util/decorators.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

const CRF_VALUE = 30;
const DEFAULT_FPS = 30;

const debugFfmpeg = debug('puppeteer:ffmpeg');

/**
 * @internal
 */
export interface ScreenRecorderOptions {
  ffmpegPath?: string;
  speed?: number;
  crop?: BoundingBox;
  format?: FileFormat;
  fps?: number;
  loop?: number;
  delay?: number;
  quality?: number;
  colors?: number;
  scale?: number;
  path?: FilePath;
  overwrite?: boolean;
}

/**
 * @public
 */
export class ScreenRecorder extends PassThrough {
  #page: Page;

  #process: ChildProcessWithoutNullStreams;

  #controller = new AbortController();
  #lastFrame: Promise<readonly [Buffer, number]>;

  #fps: number;

  /**
   * @internal
   */
  constructor(
    page: Page,
    width: number,
    height: number,
    {
      ffmpegPath,
      speed,
      scale,
      crop,
      format,
      fps,
      loop,
      delay,
      quality,
      colors,
      path,
      overwrite,
    }: ScreenRecorderOptions = {},
  ) {
    super({allowHalfOpen: false});

    ffmpegPath ??= 'ffmpeg';
    format ??= 'webm';
    fps ??= DEFAULT_FPS;
    // Maps 0 to -1 as ffmpeg maps 0 to infinity.
    loop ||= -1;
    delay ??= -1;
    colors ??= 256;
    overwrite ??= true;

    this.#fps = fps;

    // Tests if `ffmpeg` exists.
    const {error} = spawnSync(ffmpegPath);
    if (error) {
      throw error;
    }

    const filters = [
      `crop='min(${width},iw):min(${height},ih):0:0'`,
      `pad=${width}:${height}:0:0`,
    ];
    if (speed) {
      filters.push(`setpts=${1 / speed}*PTS`);
    }
    if (crop) {
      filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
    }
    if (scale) {
      filters.push(`scale=iw*${scale}:-1:flags=lanczos`);
    }

    const formatArgs = this.#getFormatArgs(
      path !== undefined,
      format,
      fps,
      loop,
      delay,
      quality,
      colors,
    );
    const vf = formatArgs.indexOf('-vf');
    if (vf !== -1) {
      filters.push(formatArgs.splice(vf, 2).at(-1) ?? '');
    }

    const dir = path ? dirname(path) : format;

    if (format in ImageFormat) {
      // Incremental file naming, e.g. 0001-9999.png
      path ??= `${dir}/%04d.${format}`;
    }
    // Ensure provided output directory path exists.
    if (path) {
      fs.mkdirSync(dir, {recursive: overwrite});
    }

    this.#process = spawn(
      ffmpegPath,
      // See https://trac.ffmpeg.org/wiki/Encode/VP9 for more information on flags.
      [
        ['-loglevel', 'error'],
        // Reduces general buffering.
        ['-avioflags', 'direct'],
        // Reduces initial buffering while analyzing input fps and other stats.
        [
          '-fpsprobesize',
          '0',
          '-probesize',
          '32',
          '-analyzeduration',
          '0',
          '-fflags',
          'nobuffer',
        ],
        // Forces input to be read from standard input, and forces png input
        // image format.
        ['-f', 'image2pipe', '-vcodec', 'png', '-i', 'pipe:0'],
        // No audio
        ['-an'],
        // This drastically reduces stalling when cpu is overbooked. By default
        // VP9 tries to use all available threads?
        ['-threads', '1'],
        // Specifies the frame rate we are giving ffmpeg.
        ['-framerate', `${fps}`],
        // Disable bitrate.
        ['-b:v', '0'],
        // Specifies the encoding and format we are using.
        formatArgs,
        // Filters to ensure the images are piped correctly,
        // combined with any format-specific filters.
        ['-vf', filters.join()],
        // Write to provided path, else pipe to stdout.
        path ?? 'pipe:1',
        // Overwrite output, or exit immediately if file already exists.
        [overwrite ? '-y' : '-n'],
      ].flat(),
      {stdio: ['pipe', 'pipe', 'pipe']},
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
      fromEmitterEvent(client, 'Page.screencastFrame').pipe(
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
              Math.round(fps * Math.max(timestamp - previousTimestamp, 0)),
            ).fill(buffer),
          );
        }),
        map(buffer => {
          void this.#writeFrame(buffer);
          return [buffer, performance.now()] as const;
        }),
        takeUntil(fromEvent(this.#controller.signal, 'abort')),
      ),
      {defaultValue: [Buffer.from([]), performance.now()] as const},
    );
  }

  #getFormatArgs(
    path: boolean,
    format: FileFormat,
    fps: number | 'source_fps',
    loop: number,
    delay: number,
    quality: number | undefined,
    colors: number,
  ): string[] {
    const crf = quality ?? CRF_VALUE;
    const libvpx = [
      ['-vcodec', 'vp9'],
      // Sets the quality. Lower the better.
      crf ? ['-crf', `${crf}`] : ['-lossless', '1'],
      // Sets the quality and how efficient the compression will be.
      [
        '-deadline',
        'realtime',
        '-cpu-used',
        `${Math.min(os.cpus().length / 2, 8)}`,
      ],
    ];
    const image = [
      // Sets the format
      ['-f', 'image2'],
    ];
    switch (format) {
      default:
        return [];
      case 'webm':
        return [
          ...libvpx,
          // Sets the format
          ['-f', 'webm'],
        ].flat();
      case 'gif':
        fps = DEFAULT_FPS === fps ? 20 : 'source_fps';
        if (loop === Infinity) {
          loop = 0;
        }
        if (delay !== -1) {
          // ms to cs
          delay /= 10;
        }
        return [
          // Sets the frame rate and uses a custom palette generated from the
          // input.
          [
            '-vf',
            `fps=${fps},split[s0][s1];[s0]palettegen=stats_mode=diff:max_colors=${colors}[p];[s1][p]paletteuse=dither=bayer`,
          ],
          // Sets the number of times to loop playback.
          ['-loop', `${loop}`],
          // Sets the delay between iterations of a loop.
          ['-final_delay', `${delay}`],
          // Sets the format
          ['-f', 'gif'],
        ].flat();
      case 'mp4':
        return [
          ...libvpx,
          // Fragment file during stream to avoid errors.
          ['-movflags', 'hybrid_fragmented'],
          // Sets the format
          ['-f', 'mp4'],
        ].flat();
      case 'png':
        return path ? image.flat() : [];
      case 'jpeg':
        quality ??= 5;
        return path
          ? [
              ...image,
              // Sets the quality
              ['-qscale', `${quality}`],
              quality <= 1 ? ['-qmin', '1'] : [],
            ].flat()
          : [];
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
          Math.round((this.#fps * (performance.now() - timestamp)) / 1000),
        ),
      )
        .fill(buffer)
        .map(this.#writeFrame.bind(this)),
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
  override async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
  }
}
