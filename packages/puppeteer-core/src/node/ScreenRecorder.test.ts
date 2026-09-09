/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {countFrames} from './ScreenRecorder.js';

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
});
