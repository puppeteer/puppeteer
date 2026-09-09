/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import assert from 'node:assert';
import fs from 'node:fs';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import expect from 'expect';

import {launch} from '../mocha-utils.js';

const TMP_FOLDER = path.join(os.tmpdir(), 'pptr_tmp_folder-');

describe('userDataDir', function () {
  for (const pipe of [true, false]) {
    it(`should not launch the browser twice with the same userDataDir with pipe=${pipe}`, async () => {
      const userDataDir = await mkdtemp(TMP_FOLDER);
      const {browser, close} = await launch({userDataDir, pipe});
      // Open a page to make sure its functional.
      try {
        await browser.newPage();
        expect(fs.readdirSync(userDataDir).length).toBeGreaterThan(0);

        try {
          const {close: close2} = await launch({
            userDataDir,
            pipe,
          });
          await close2();
          assert.fail('Not reached');
        } catch (err) {
          assert.strictEqual(
            (err as Error).message.startsWith(
              'The browser is already running for',
            ),
            true,
          );
        }
      } finally {
        await close();
      }
    });
  }

  it('should report a permission error when the userDataDir is not writable', async function () {
    // Windows ignores the read-only bit for the directory owner, and root
    // bypasses the write check entirely, so neither can observe the failure.
    if (os.platform() === 'win32' || process.getuid?.() === 0) {
      return this.skip();
    }
    const userDataDir = await mkdtemp(TMP_FOLDER);
    fs.chmodSync(userDataDir, 0o555);
    try {
      const {close} = await launch({userDataDir});
      await close();
      assert.fail('Not reached');
    } catch (err) {
      assert.strictEqual(
        (err as Error).message.startsWith('The browser cannot write to'),
        true,
      );
    } finally {
      fs.chmodSync(userDataDir, 0o755);
    }
  });
});
