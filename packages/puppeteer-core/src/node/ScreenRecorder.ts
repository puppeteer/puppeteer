/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import {spawn, spawnSync} from 'node:child_process';
import os from 'node:os';
import {PassThrough} from 'node:stream';

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
import type {Page, VideoFormat} from '../api/Page.js';
import {DEBUG_PREFIXES, type Logger} from '../common/Debug.js';
import {fromEmitterEvent} from '../common/util.js';
import {guarded} from '../util/decorators.js';
import {asyncDisposeSymbol} from '../util/disposable.js';

const CRF_VALUE = 30;
const DEFAULT_FPS = 30;

/**
 * Computes how many encoder frames to emit for a captured frame that spans
 * `[previousTimestamp, timestamp]`, so that the cumulative number of emitted
 * frames tracks a constant-`fps` grid anchored at `startTimestamp`.
 *
 * Counting each interval independently with
 * `Math.round(fps * (timestamp - previousTimestamp))` is wrong when frames are
 * captured faster than `fps`: every sub-`1/fps` interval still rounds up to a
 * whole frame, so the emitted frame count grows with the capture rate instead
 * of staying at `fps * duration`, which stretches playback (and, for very high
 * capture rates, the per-interval value rounds down to 0 and frames are
 * dropped). Differencing the rounded cumulative position keeps the total at
 * `Math.round(fps * (lastTimestamp - startTimestamp))`, independent of the
 * capture rate.
 *
 * Timestamps are in seconds (CDP `Page.screencastFrame` metadata timestamps).
 *
 * @internal
 */
export function countFrames(
  startTimestamp: number,
  previousTimestamp: number,
  timestamp: number,
  fps: number,
): number {
  const end = Math.round((timestamp - startTimestamp) * fps);
  const start = Math.round((previousTimestamp - startTimestamp) * fps);
  return Math.max(0, end - start);
}

function roundPixelDimension(value: number): number {
  return Math.round(value);
}

/**
 * @internal
 */
export interface ScreenRecorderOptions {
  ffmpegPath?: string;
  speed?: number;
  crop?: BoundingBox;
  format?: VideoFormat;
  fps?: number;
  loop?: number;
  delay?: number;
  quality?: number;
  colors?: number;
  scale?: number;
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
  #logger?: Logger;
  #encoderError?: Error;
  #closed: Promise<void>;

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
    }: ScreenRecorderOptions = {},
    logger?: Logger,
  ) {
    super({allowHalfOpen: false});

    this.#logger = logger;

    ffmpegPath ??= 'ffmpeg';
    format ??= 'webm';
    fps ??= DEFAULT_FPS;
    // Maps 0 to -1 as ffmpeg maps 0 to infinity.
    loop ||= -1;
    delay ??= -1;
    quality ??= CRF_VALUE;
    colors ??= 256;

    this.#fps = fps;

    // Tests if `ffmpeg` exists.
    const {error} = spawnSync(ffmpegPath);
    if (error) {
      throw error;
    }

    // crop rounds fractional dimensions, while pad truncates them. The same
    // fractional input can make the padded size smaller than the cropped
    // frame, and ffmpeg exits. Both filters have to receive the same integer.
    const pixelWidth = roundPixelDimension(width);
    const pixelHeight = roundPixelDimension(height);
    const pixelCrop = crop
      ? {
          x: roundPixelDimension(crop.x),
          y: roundPixelDimension(crop.y),
          width: roundPixelDimension(crop.width),
          height: roundPixelDimension(crop.height),
        }
      : undefined;

    const filters = [
      `crop='min(${pixelWidth},iw):min(${pixelHeight},ih):0:0'`,
      `pad=${pixelWidth}:${pixelHeight}:0:0`,
    ];
    if (speed) {
      filters.push(`setpts=${1 / speed}*PTS`);
    }
    if (pixelCrop) {
      filters.push(
        `crop=${pixelCrop.width}:${pixelCrop.height}:${pixelCrop.x}:${pixelCrop.y}`,
      );
    }
    if (scale) {
      filters.push(`scale=iw*${scale}:-1:flags=lanczos`);
    }

    const formatArgs = this.#getFormatArgs(
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
        // image format. `-framerate` is an input option and must appear before
        // `-i`; otherwise ffmpeg ignores it and the image2pipe demuxer falls
        // back to its default 25fps, stretching the output timeline relative to
        // the frames we feed it at `fps`.
        // prettier-ignore
        ['-framerate', `${fps}`, '-f', 'image2pipe', '-vcodec', 'png', '-i', 'pipe:0'],
        // No audio
        ['-an'],
        // This drastically reduces stalling when cpu is overbooked. By default
        // VP9 tries to use all available threads?
        ['-threads', '1'],
        // Disable bitrate.
        ['-b:v', '0'],
        // Specifies the encoding and format we are using.
        formatArgs,
        // Filters to ensure the images are piped correctly,
        // combined with any format-specific filters.
        ['-vf', filters.join()],
        'pipe:1',
      ].flat(),
      {stdio: ['pipe', 'pipe', 'pipe']},
    );
    // ffmpeg exiting closes stdin. The next frame write emits EPIPE here,
    // and with no listener Node terminates the process.
    this.#process.stdin.on('error', error => {
      this.#captureEncoderError(error);
    });
    // Registered at spawn: stop() can run after 'close' has already fired.
    this.#closed = new Promise(resolve => {
      this.#process.once('close', (code, signal) => {
        this.#captureEncoderExit(code, signal);
        resolve();
      });
    });
    this.#process.stdout.pipe(this);
    this.#process.stderr.on('data', (data: Buffer) => {
      this.#logger?.(DEBUG_PREFIXES.ffmpeg)?.(data.toString('utf8'));
    });

    this.#page = page;

    const {client} = this.#page.mainFrame();
    client.once(CDPSessionEvent.Disconnected, () => {
      void this.stop().catch(err => {
        this.#logger?.(DEBUG_PREFIXES.error)?.(err);
      });
    });

    // Anchor for the constant-fps grid; set to the first frame's timestamp.
    let startTimestamp: number | undefined;
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
          startTimestamp ??= previousTimestamp;
          return from(
            Array<Buffer>(
              countFrames(startTimestamp, previousTimestamp, timestamp, fps),
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
    format: VideoFormat,
    fps: number | 'source_fps',
    loop: number,
    delay: number,
    quality: number,
    colors: number,
  ): string[] {
    const libvpx = [
      ['-vcodec', 'vp9'],
      // Sets the quality. Lower the better.
      ['-crf', `${quality}`],
      // Sets the quality and how efficient the compression will be.
      [
        '-deadline',
        'realtime',
        '-cpu-used',
        `${Math.min(os.cpus().length / 2, 8)}`,
      ],
    ];
    switch (format) {
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
    }
  }

  #captureEncoderError(error: Error): void {
    if (this.#encoderError) {
      return;
    }
    this.#encoderError = error;
    this.#logger?.(DEBUG_PREFIXES.error)?.(error);
  }

  #captureEncoderExit(
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void {
    if (code !== null && code !== 0) {
      this.#captureEncoderError(new Error(`ffmpeg exited with code ${code}.`));
      return;
    }
    if (signal) {
      this.#captureEncoderError(
        new Error(`ffmpeg was killed with signal ${signal}.`),
      );
    }
  }

  #encoderHasExited(): boolean {
    return this.#process.exitCode !== null || this.#process.signalCode !== null;
  }

  @guarded()
  async #writeFrame(buffer: Buffer): Promise<void> {
    if (
      this.#encoderError ||
      this.#encoderHasExited() ||
      this.#process.stdin.destroyed
    ) {
      return;
    }
    const error = await new Promise<Error | null | undefined>(resolve => {
      this.#process.stdin.write(buffer, resolve);
    });
    if (error) {
      this.#captureEncoderError(error);
    }
  }

  /**
   * Stops the recorder.
   *
   * @remarks
   * Rejects if ffmpeg fails. A failure that happened before `stop()` was
   * called is still reported, instead of resolving an empty recording.
   *
   * @public
   */
  @guarded()
  async stop(): Promise<void> {
    if (this.#controller.signal.aborted) {
      if (this.#encoderError) {
        throw this.#encoderError;
      }
      return;
    }
    // Stopping the screencast will flush the frames.
    await this.#page._stopScreencast().catch(error => {
      this.#logger?.(DEBUG_PREFIXES.error)?.(error);
    });

    this.#controller.abort();

    // Repeat the last frame for the remaining frames.
    const [buffer, timestamp] = await this.#lastFrame;
    if (!this.#encoderError && !this.#encoderHasExited()) {
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
    }

    // Close stdin to notify FFmpeg we are done. Skip this when the process
    // has already exited: its 'close' event has fired, and ending a destroyed
    // stdin only produces another pipe error.
    if (!this.#encoderHasExited() && !this.#process.stdin.destroyed) {
      this.#process.stdin.end();
    }
    await this.#closed;
    if (this.#encoderError) {
      throw this.#encoderError;
    }
  }

  override async [asyncDisposeSymbol](): Promise<void> {
    await this.stop();
    await super[asyncDisposeSymbol]();
  }
}
