/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';

import {makeUnpackProgressCallback} from '../../lib/esm/main.js';

describe('makeUnpackProgressCallback', () => {
  let originalStderrWrite: typeof process.stderr.write;
  let captured: string;

  beforeEach(() => {
    captured = '';
    originalStderrWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: string | Uint8Array) => {
      captured += typeof chunk === 'string' ? chunk : chunk.toString();
      return true;
    }) as typeof process.stderr.write;
  });

  afterEach(() => {
    process.stderr.write = originalStderrWrite;
  });

  it('writes a status line on "started"', () => {
    const cb = makeUnpackProgressCallback();
    cb('started');
    assert.ok(
      captured.includes('Unpacking archive'),
      `expected "Unpacking archive" in output, got ${JSON.stringify(captured)}`,
    );
  });

  it('writes a completion marker on "finished"', () => {
    const cb = makeUnpackProgressCallback();
    cb('started');
    cb('finished');
    assert.ok(
      captured.includes('done'),
      `expected "done" in output, got ${JSON.stringify(captured)}`,
    );
  });
});
