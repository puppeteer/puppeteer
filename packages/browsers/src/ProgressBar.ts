/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// Module-level active session. Concurrent bars share a session; a new session
// starts whenever no bar is currently active (or the stream changes).
let activeBar: ProgressBar | null = null;

/**
 * Manages one or more concurrent progress bars on separate terminal lines.
 * Use {@link ProgressBar.createBarTicker} to add a bar; concurrent calls
 * automatically share a session so bars don't overwrite each other.
 *
 * @internal
 */
export class ProgressBar {
  #stream: NodeJS.WriteStream;
  #totalRows = 0;
  #doneCount = 0;
  #bars: Array<{
    title: string;
    total: number;
    downloaded: number;
    startTime: number;
    lastRendered: string;
  }> = [];
  #renderScheduled = false;
  #lastRenderTime = 0;
  #allDone = false;

  private constructor(stream: NodeJS.WriteStream) {
    this.#stream = stream;
  }

  /**
   * Returns a `tick(delta)` function for a new progress bar. If another bar
   * is already active on the same stream, the new bar appears on the next line
   * and both update in place. The trailing newline is emitted automatically
   * once every bar in the session has reached 100%.
   */
  static createBarTicker(
    title: string,
    total: number,
    stream: NodeJS.WriteStream = process.stderr as NodeJS.WriteStream,
  ): (delta: number) => void {
    // Start a fresh session when none is active or the stream changed.
    if (!activeBar || activeBar.#stream !== stream) {
      activeBar = new ProgressBar(stream);
    }
    return activeBar.#addBar(title, total);
  }

  #claimRow(): number {
    const row = this.#totalRows++;
    if (row > 0 && this.#stream.isTTY) {
      // Cursor is parked at col 0 of the previous bottom row; \n opens the
      // new line and moves the cursor there, establishing the new bottom row.
      this.#stream.write('\n');
    }
    return row;
  }

  #addBar(title: string, total: number): (delta: number) => void {
    const row = this.#claimRow();
    this.#bars.push({
      title,
      total,
      downloaded: 0,
      startTime: 0,
      lastRendered: '',
    });
    let doneNotified = false;

    return (delta: number) => {
      const bar = this.#bars[row]!;
      if (bar.startTime === 0) {
        bar.startTime = Date.now();
      }
      bar.downloaded += delta;

      const isDone = bar.downloaded >= bar.total;
      if (isDone || Date.now() - this.#lastRenderTime >= 100) {
        this.#scheduleRender();
      }

      if (isDone && !doneNotified) {
        doneNotified = true;
        this.#onBarDone();
      }
    };
  }

  // Defers to a microtask so multiple ticks in the same turn share one render
  // pass and the cursor only moves once.
  #scheduleRender(): void {
    if (!this.#renderScheduled) {
      this.#renderScheduled = true;
      queueMicrotask(() => {
        this.#renderScheduled = false;
        this.#lastRenderTime = Date.now();
        this.#renderAll();
      });
    }
  }

  #computeRendered(row: number): string {
    const bar = this.#bars[row]!;
    const ratio = Math.min(1, Math.max(0, bar.downloaded / bar.total));
    const percent = Math.round(ratio * 100);
    const elapsedMs = bar.startTime > 0 ? Date.now() - bar.startTime : 0;
    const rate = elapsedMs > 0 ? bar.downloaded / elapsedMs : 0; // bytes/ms
    const etaSec = rate > 0 ? (bar.total - bar.downloaded) / rate / 1000 : 0;
    const width = 20;
    const completeCount = Math.round(width * ratio);
    const barStr =
      '='.repeat(completeCount) + ' '.repeat(width - completeCount);
    const status =
      ratio >= 1 ? 'unpacking' : `${percent}% ${etaSec.toFixed(1)}s`;
    return `${bar.title} [${barStr}] ${status} `;
  }

  // Invariant: cursor is at col 0 of the bottom row before and after this call.
  // Single top-down pass: go up to bar 0, render each bar, come back to bottom.
  #renderAll(): void {
    if (!this.#stream.isTTY) {
      return;
    }
    const N = this.#totalRows;
    if (N === 0) {
      return;
    }

    // Move cursor to top of bar area.
    if (N > 1) {
      this.#stream.moveCursor(0, -(N - 1));
    }

    for (let row = 0; row < N; row++) {
      const rendered = this.#computeRendered(row);
      if (rendered !== this.#bars[row]!.lastRendered) {
        this.#stream.cursorTo(0);
        this.#stream.write(rendered);
        this.#stream.clearLine(1);
        this.#bars[row]!.lastRendered = rendered;
      }
      if (row < N - 1) {
        this.#stream.moveCursor(0, 1);
      }
    }

    // Park cursor at col 0 of the bottom row.
    this.#stream.cursorTo(0);

    if (this.#allDone) {
      activeBar = null;
      this.#stream.write('\n');
    }
  }

  #onBarDone(): void {
    this.#doneCount++;
    if (this.#doneCount >= this.#totalRows && this.#totalRows > 0) {
      this.#allDone = true;
      // Don't emit \n here — the pending render microtask hasn't run yet.
      // #renderAll() will emit it after the final pass so the cursor is
      // already past the last bar line before the newline moves it.
    }
  }
}
