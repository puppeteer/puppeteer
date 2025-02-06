/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  internalConstantsForTesting,
  unpackArchive,
} from '../../lib/cjs/fileUtil.js';

describe('fileUtil', function () {
  let tmpDir = '/tmp/puppeteer-browsers-test';

  const fixturesPath = path.join(__dirname, '..', 'fixtures');

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer-browsers-test'));
  });

  afterEach(async () => {
    try {
      fs.rmSync(tmpDir, {
        force: true,
        recursive: true,
        maxRetries: 10,
        retryDelay: 500,
      });
    } catch {}
  });

  function assertTestArchiveUnpacked(): void {
    const dir = fs
      .readdirSync(tmpDir, {
        recursive: true,
      })
      .filter(item => {
        return !(item as string).startsWith('._');
      });
    assert.deepStrictEqual(dir, [
      'test',
      path.join('test', 'folder'),
      path.join('test', 'main.txt'),
      path.join('test', 'run.sh'),
      path.join('test', 'folder', 'folder.txt'),
    ]);
    assert.strictEqual(
      fs.readFileSync(path.join(tmpDir, 'test/main.txt'), 'utf8'),
      'main',
    );
    const modes = dir.map(item => {
      return (
        fs.statSync(path.join(tmpDir, item)).mode &
        (fs.constants.S_IRWXU | fs.constants.S_IRWXG | fs.constants.S_IRWXO)
      ).toString(8);
    });
    assert.deepStrictEqual(
      modes,
      os.platform() === 'win32'
        ? ['0', '0', '0', '0', '0']
        : ['750', '750', '750', '751', '750'],
    );
  }

  function assertTestArchiveEmpty(): void {
    const dir = fs.readdirSync(tmpDir, {
      recursive: true,
    });
    assert.deepStrictEqual(dir, []);
  }

  it('unpacks tar.xz', async () => {
    await unpackArchive(path.join(fixturesPath, 'test.tar.xz'), tmpDir);
    assertTestArchiveUnpacked();
  });

  it('unpacks tar.bz2', async () => {
    await unpackArchive(path.join(fixturesPath, 'test.tar.bz2'), tmpDir);
    assertTestArchiveUnpacked();
  });

  it('throws an error if xz is not found', async () => {
    internalConstantsForTesting.xz = 'xz-not-existent';
    try {
      try {
        await unpackArchive(path.join(fixturesPath, 'test.tar.xz'), tmpDir);
        assert.fail('unpacking did not fail');
      } catch (error) {
        assert.equal(
          (error as Error).message,
          '`xz` utility is required to unpack this archive',
        );
      }
      assertTestArchiveEmpty();
    } finally {
      internalConstantsForTesting.xz = 'xz';
    }
  });

  it('throws an error if bzip2 is not found', async () => {
    internalConstantsForTesting.bzip2 = 'bzip2-not-existent';
    try {
      try {
        await unpackArchive(path.join(fixturesPath, 'test.tar.bz2'), tmpDir);
        assert.fail('unpacking did not fail');
      } catch (error) {
        assert.equal(
          (error as Error).message,
          '`bzip2` utility is required to unpack this archive',
        );
      }
      assertTestArchiveEmpty();
    } finally {
      internalConstantsForTesting.bzip2 = 'bzip2';
    }
  });
});
