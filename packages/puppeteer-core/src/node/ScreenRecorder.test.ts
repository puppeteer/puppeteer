/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {spawnSync} from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it} from 'node:test';

import expect from 'expect';

import type {Page} from '../api/Page.js';
import {EventEmitter} from '../common/EventEmitter.js';
import {Deferred} from '../util/Deferred.js';

import {countFrames, ScreenRecorder} from './ScreenRecorder.js';

const ffmpegAvailable =
  spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status === 0;

type ScreencastEvents = Record<string | symbol, unknown>;

function createRecorder(
  width: number,
  height: number,
  options: ConstructorParameters<typeof ScreenRecorder>[3] = {},
): {
  client: EventEmitter<ScreencastEvents>;
  recorder: ScreenRecorder;
  [Symbol.asyncDispose](): Promise<void>;
} {
  const client = new EventEmitter<ScreencastEvents>();
  Object.assign(client, {
    send: async () => {
      return {};
    },
  });
  // ScreenRecorder only reads mainFrame().client and calls _stopScreencast().
  const page = {
    mainFrame() {
      return {client};
    },
    async _stopScreencast() {},
  } as unknown as Page;
  const recorder = new ScreenRecorder(page, width, height, options);
  recorder.resume();
  return {
    client,
    recorder,
    async [Symbol.asyncDispose]() {
      await recorder.stop().catch(() => {});
    },
  };
}

function emitFrames(
  client: EventEmitter<ScreencastEvents>,
  frame: Buffer,
): void {
  for (const [index, timestamp] of [0, 1 / 30].entries()) {
    client.emit('Page.screencastFrame', {
      data: frame.toString('base64'),
      metadata: {timestamp},
      sessionId: index + 1,
    });
  }
}

/**
 * Stands in for ffmpeg. The existence check exits immediately. A real
 * screencast spawn records its arguments, then exits on the first stdin
 * write so the recorder hits a closed pipe. Dispose removes its directory.
 */
function createFakeFfmpeg(): {
  command: string;
  readArgs: () => Promise<string>;
  [Symbol.dispose](): void;
} {
  const directory = mkdtempSync(join(tmpdir(), 'pptr-ffmpeg-'));
  const script = join(directory, 'fake-ffmpeg.mjs');
  writeFileSync(
    script,
    [
      "import {writeFileSync} from 'node:fs';",
      "import {dirname, join} from 'node:path';",
      'const args = process.argv.slice(2);',
      "if (!args.includes('pipe:0')) process.exit(0);",
      "writeFileSync(join(dirname(process.argv[1]), 'args'), args.join('\\n'));",
      "process.stdin.on('data', () => process.exit(1));",
      "process.stdin.on('end', () => process.exit(1));",
      'process.stdin.resume();',
      '',
    ].join('\n'),
  );
  let command: string;
  if (process.platform === 'win32') {
    command = join(directory, 'ffmpeg.cmd');
    writeFileSync(
      command,
      `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`,
    );
  } else {
    command = join(directory, 'ffmpeg');
    const quote = (value: string) => {
      return `'${value.replaceAll("'", "'\\''")}'`;
    };
    writeFileSync(
      command,
      `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(script)} "$@"\n`,
    );
    chmodSync(command, 0o755);
  }
  return {
    command,
    async readArgs() {
      const path = join(directory, 'args');
      const started = Date.now();
      while (Date.now() - started < 5000) {
        try {
          return readFileSync(path, 'utf8');
        } catch {
          await new Promise(resolve => {
            setTimeout(resolve, 20);
          });
        }
      }
      throw new Error('ffmpeg was not spawned');
    },
    [Symbol.dispose]() {
      rmSync(directory, {recursive: true, force: true});
    },
  };
}

describe('ScreenRecorder', () => {
  describe('countFrames', () => {
    const FPS = 30;

    // Total frames emitted for a stream captured at `captureFps` for `seconds`,
    // anchored at t=0 — i.e. summing countFrames over each captured interval.
    function totalFrames(
      captureFps: number,
      seconds: number,
      fps = FPS,
    ): number {
      const frames = Math.round(captureFps * seconds);
      let total = 0;
      let previous = 0;
      for (let i = 1; i <= frames; i++) {
        const timestamp = i / captureFps;
        total += countFrames(0, previous, timestamp, fps);
        previous = timestamp;
      }
      return total;
    }

    it('keeps the total close to fps * duration for any capture rate', () => {
      for (const captureFps of [24, 30, 31, 48, 53, 60, 90, 120]) {
        const total = totalFrames(captureFps, 1);
        // Always ~30 frames for 1s at 30fps, within one frame of rounding.
        expect(total).toBeGreaterThanOrEqual(FPS - 1);
        expect(total).toBeLessThanOrEqual(FPS + 1);
      }
    });

    it('does not inflate the count when captured faster than fps', () => {
      // The old per-interval rounding wrote ~1 frame per captured frame, i.e.
      // ~60 frames for 1s captured at 60fps (a 2x timeline stretch).
      expect(totalFrames(60, 1)).toBeLessThanOrEqual(FPS + 1);
    });

    it('does not drop all frames when captured much faster than fps', () => {
      // The old per-interval rounding computed round(30/120) = 0 per interval,
      // dropping every frame. The corrected accounting keeps ~30.
      expect(totalFrames(120, 1)).toBeGreaterThanOrEqual(FPS - 1);
    });

    it('scales with the requested fps', () => {
      expect(totalFrames(60, 1, 60)).toBeGreaterThanOrEqual(59);
      expect(totalFrames(60, 1, 60)).toBeLessThanOrEqual(61);
    });

    it('returns zero for non-increasing timestamps', () => {
      expect(countFrames(0, 1, 1, FPS)).toBe(0);
      expect(countFrames(0, 1, 0.5, FPS)).toBe(0);
    });
  });

  describe('ffmpeg lifecycle', () => {
    it('rounds fractional dimensions passed to ffmpeg', async () => {
      using ffmpeg = createFakeFfmpeg();
      await using _session = createRecorder(
        3059.999918937683,
        1893.599949836731,
        {
          ffmpegPath: ffmpeg.command,
          format: 'mp4',
          crop: {x: 1.4, y: 2.6, width: 10.2, height: 8.8},
        },
      );
      const args = await ffmpeg.readArgs();
      expect(args).toContain('pad=3060:1894:0:0');
      expect(args).toContain('crop=10:9:1:3');
      expect(args).not.toContain('3059.9999');
      expect(args).not.toContain('1893.5999');
    });

    it('reports an early ffmpeg exit from stop()', async () => {
      using ffmpeg = createFakeFfmpeg();
      await using session = createRecorder(320, 180, {
        ffmpegPath: ffmpeg.command,
        format: 'mp4',
      });
      emitFrames(session.client, Buffer.from('frame'));
      await expect(
        Deferred.race([
          session.recorder.stop(),
          Deferred.create<void>({
            timeout: 5000,
            message: 'stop() hung after ffmpeg exited',
          }),
        ]),
      ).rejects.toThrow(/write EPIPE|ffmpeg exited with code 1/);
    });

    it(
      'records when fractional dimensions are rounded',
      {skip: !ffmpegAvailable},
      async () => {
        const generated = spawnSync(
          'ffmpeg',
          [
            '-hide_banner',
            '-loglevel',
            'error',
            '-f',
            'lavfi',
            '-i',
            'color=red:size=180x100:rate=1,format=rgb24',
            '-frames:v',
            '1',
            '-f',
            'image2pipe',
            '-vcodec',
            'png',
            'pipe:1',
          ],
          {maxBuffer: 8 * 1024 * 1024},
        );
        expect(generated.status).toBe(0);
        await using session = createRecorder(
          159.999918937683,
          89.599949836731,
          {format: 'mp4'},
        );
        let bytes = 0;
        session.recorder.on('data', (data: Buffer) => {
          bytes += data.length;
        });
        try {
          emitFrames(session.client, generated.stdout);
          await Deferred.race([
            session.recorder.stop(),
            Deferred.create<void>({
              timeout: 5000,
              message: 'stop() hung',
            }),
          ]);
        } finally {
          expect(bytes).toBeGreaterThan(0);
        }
      },
    );
  });
});
