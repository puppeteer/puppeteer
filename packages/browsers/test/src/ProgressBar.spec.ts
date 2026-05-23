/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';

import {ProgressBar} from '../../lib/ProgressBar.js';

describe('ProgressBar', () => {
  let writes: string[] = [];
  let cursorToCalls: number[] = [];
  let clearLineCalls: number[] = [];

  function createMockStream(isTTY: boolean, columns = 80) {
    writes = [];
    cursorToCalls = [];
    clearLineCalls = [];

    return {
      isTTY,
      columns,
      write(str: string) {
        writes.push(str);
        return true;
      },
      cursorTo(x: number) {
        cursorToCalls.push(x);
        return this;
      },
      clearLine(dir: number) {
        clearLineCalls.push(dir);
        return this;
      },
    } as unknown as NodeJS.WriteStream;
  }

  it('should not render when isTTY is false', () => {
    const stream = createMockStream(false);
    const bar = new ProgressBar('Downloading', {
      total: 100,
      stream,
    });

    bar.tick(50);
    assert.strictEqual(writes.length, 0);
  });

  it('should not write newline on completion when isTTY is false', () => {
    const stream = createMockStream(false);
    const bar = new ProgressBar('Downloading', {
      total: 100,
      stream,
    });

    bar.tick(100);
    assert.strictEqual(writes.length, 0);
  });

  it('should render bar and percent tokens on TTY streams', () => {
    const stream = createMockStream(true, 80);
    const bar = new ProgressBar('Downloading', {
      total: 10,
      stream,
    });

    bar.tick(5);
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(
      writes[0],
      'Downloading [==========          ] 50% 0.0s ',
    );
    assert.deepStrictEqual(cursorToCalls, [0]);
    assert.deepStrictEqual(clearLineCalls, [1]);
  });

  it('should complete the progress bar and print a newline', () => {
    const stream = createMockStream(true, 80);
    const bar = new ProgressBar('Downloading', {
      total: 4,
      stream,
    });

    bar.tick(2);
    assert.strictEqual(
      writes[writes.length - 1],
      'Downloading [==========          ] 50% 0.0s ',
    );

    bar.tick(2);
    assert.strictEqual(
      writes[writes.length - 2],
      'Downloading [====================] 100% 0.0s ',
    );
    assert.strictEqual(writes[writes.length - 1], '\n');
  });
});
