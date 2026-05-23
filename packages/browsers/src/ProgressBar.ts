/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @internal
 */
export interface ProgressBarOptions {
  total: number;
  stream?: NodeJS.WriteStream;
}

/**
 * @internal
 */
export class ProgressBar {
  #title: string;
  #total: number;
  #stream: NodeJS.WriteStream;
  #downloaded = 0;
  #startTime = 0;
  #lastDrawn = '';

  constructor(title: string, options: ProgressBarOptions) {
    this.#title = title;
    this.#total = options.total;
    this.#stream = options.stream ?? process.stderr;
  }

  tick(delta: number): void {
    if (this.#startTime === 0) {
      this.#startTime = Date.now();
    }
    this.#downloaded += delta;

    this.#render();

    if (this.#downloaded >= this.#total && this.#stream.isTTY) {
      this.#stream.write('\n');
    }
  }

  #render(): void {
    if (!this.#stream.isTTY) {
      return;
    }

    const ratio = Math.min(1, Math.max(0, this.#downloaded / this.#total));
    const percent = Math.round(ratio * 100);
    const elapsedMs = Date.now() - this.#startTime;
    const rate = elapsedMs > 0 ? this.#downloaded / elapsedMs : 0; // bytes per millisecond
    const remaining = this.#total - this.#downloaded;
    const etaSec = rate > 0 ? remaining / rate / 1000 : 0;

    const width = 20;
    const completeCount = Math.round(width * ratio);
    const barStr =
      '='.repeat(completeCount) + ' '.repeat(width - completeCount);

    const rendered = `${this.#title} [${barStr}] ${percent}% ${etaSec.toFixed(1)}s `;

    if (this.#lastDrawn !== rendered) {
      this.#stream.cursorTo(0);
      this.#stream.write(rendered);
      this.#stream.clearLine(1);
      this.#lastDrawn = rendered;
    }
  }
}
