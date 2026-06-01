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
      moveCursor(_dx: number, _dy: number) {
        return this;
      },
    } as unknown as NodeJS.WriteStream;
  }

  it('should not render when isTTY is false', async () => {
    const stream = createMockStream(false);
    const tick = ProgressBar.createBarTicker('Downloading', 100, stream);

    tick(50);
    await Promise.resolve();
    assert.strictEqual(writes.length, 0);
  });

  it('should not write newline on completion when isTTY is false', async () => {
    const stream = createMockStream(false);
    const tick = ProgressBar.createBarTicker('Downloading', 100, stream);

    tick(100);
    await Promise.resolve();
    assert.strictEqual(writes.length, 0);
  });

  it('should render bar and percent tokens on TTY streams', async () => {
    const stream = createMockStream(true, 80);
    const tick = ProgressBar.createBarTicker('Downloading', 10, stream);

    tick(5);
    await Promise.resolve();
    assert.strictEqual(writes.length, 1);
    assert.strictEqual(
      writes[0],
      'Downloading [==========          ] 50% 0.0s ',
    );
    assert.deepStrictEqual(cursorToCalls, [0, 0]); // write + park
    assert.deepStrictEqual(clearLineCalls, [1]);
  });

  it('should complete the bar and print a newline when the last bar finishes', async () => {
    const stream = createMockStream(true, 80);
    const tick = ProgressBar.createBarTicker('Downloading', 4, stream);

    tick(2);
    await Promise.resolve(); // flush microtask
    assert.strictEqual(
      writes[writes.length - 1],
      'Downloading [==========          ] 50% 0.0s ',
    );

    tick(2);
    await Promise.resolve(); // flush microtask
    assert.strictEqual(
      writes[writes.length - 2],
      'Downloading [====================] unpacking ',
    );
    assert.strictEqual(writes[writes.length - 1], '\n');
  });

  it('should auto-group concurrent bars on separate lines', async () => {
    const stream = createMockStream(true, 80);
    const tick1 = ProgressBar.createBarTicker('Browser1', 10, stream);
    const tick2 = ProgressBar.createBarTicker('Browser2', 10, stream);

    // \n separates the two rows
    assert.strictEqual(writes[0], '\n');

    tick1(10); // bar1 done
    tick2(10); // bar2 done — session ends, trailing \n emitted
    await Promise.resolve();

    assert.strictEqual(writes[writes.length - 1], '\n');
  });
});
