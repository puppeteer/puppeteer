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
  extractTarXzWithLib,
  extractZipWithYauzl,
  internalConstantsForTesting,
  unpackArchive,
} from '../../lib/fileUtil.js';

describe('fileUtil', function () {
  let tmpDir = '/tmp/puppeteer-browsers-test';

  const fixturesPath = path.join(import.meta.dirname, '..', 'fixtures');

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
  }

  function assertTestArchiveEmpty(): void {
    const dir = fs.readdirSync(tmpDir, {
      recursive: true,
    });
    assert.deepStrictEqual(dir, []);
  }

  function assertTestZipUnpacked(): void {
    const entries = fs
      .readdirSync(tmpDir, {recursive: true})
      .filter(item => {
        return !(item as string).startsWith('._');
      })
      .sort();
    assert.deepStrictEqual(entries, [
      'browser',
      path.join('browser', 'chrome'),
      path.join('browser', 'locales'),
      path.join('browser', 'locales', 'en-US.pak'),
      path.join('browser', 'product_logo.png'),
    ]);
    assert.strictEqual(
      fs.readFileSync(path.join(tmpDir, 'browser/locales/en-US.pak'), 'utf8'),
      'resource',
    );
    assert.strictEqual(
      fs.readFileSync(path.join(tmpDir, 'browser/product_logo.png'), 'utf8'),
      'logo',
    );
  }

  function assertOwnerPermissions(): void {
    const executable = fs.statSync(path.join(tmpDir, 'browser/chrome')).mode;
    assert.strictEqual(executable & 0o700, 0o700);
    const regular = fs.statSync(
      path.join(tmpDir, 'browser/product_logo.png'),
    ).mode;
    assert.strictEqual(regular & 0o700, 0o600);
  }

  function assertSymlink(): void {
    const link = path.join(tmpDir, 'browser/Current');
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.strictEqual(fs.readlinkSync(link), 'chrome');
  }

  // Only the owner triple is reliable across the platforms we support: on a
  // typical Linux desktop a umask of 002 plus a per-user private group clears
  // the group-write bit, so the group/other bits cannot be asserted exactly.
  function assertTarOwnerPermissions(): void {
    const entries = fs
      .readdirSync(tmpDir, {recursive: true, encoding: 'utf8'})
      .filter(item => {
        return !item.startsWith('._');
      });
    for (const entry of entries) {
      const owner = fs.statSync(path.join(tmpDir, entry)).mode & 0o700;
      assert.strictEqual(owner, 0o700);
    }
  }

  function assertTarSymlink(): void {
    const link = path.join(tmpDir, 'test/link');
    assert.ok(fs.lstatSync(link).isSymbolicLink());
    assert.strictEqual(fs.readlinkSync(link), 'main.txt');
  }

  async function withoutXzUtility(run: () => Promise<void>): Promise<void> {
    internalConstantsForTesting.xz = 'xz-not-existent';
    try {
      await run();
    } finally {
      internalConstantsForTesting.xz = 'xz';
    }
  }

  it('unpacks tar.xz', async () => {
    await unpackArchive(path.join(fixturesPath, 'test.tar.xz'), tmpDir);
    assertTestArchiveUnpacked();
  });

  it('unpacks tar.bz2', async () => {
    await unpackArchive(path.join(fixturesPath, 'test.tar.bz2'), tmpDir);
    assertTestArchiveUnpacked();
  });

  it('unpacks zip extracting every entry with its structure and contents', async () => {
    await unpackArchive(path.join(fixturesPath, 'test.zip'), tmpDir);
    assertTestZipUnpacked();
  });

  describe('extractZipWithYauzl', () => {
    it('extracts every entry with its structure and contents', async () => {
      await extractZipWithYauzl(path.join(fixturesPath, 'test.zip'), tmpDir);
      assertTestZipUnpacked();
    });

    // Node.js does not honor POSIX permission bits on Windows.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves owner permissions',
      async () => {
        await extractZipWithYauzl(path.join(fixturesPath, 'test.zip'), tmpDir);
        assertOwnerPermissions();
      },
    );

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves symlinks',
      async () => {
        await extractZipWithYauzl(
          path.join(fixturesPath, 'test-symlink.zip'),
          tmpDir,
        );
        assertSymlink();
      },
    );

    // The target is validated before any symlink is created, so unlike the
    // preceding symlink test the rejection can be checked on Windows too.
    it('rejects symlinks that point outside the target directory', async () => {
      await assert.rejects(
        () => {
          return extractZipWithYauzl(
            path.join(fixturesPath, 'test-symlink-escape.zip'),
            tmpDir,
          );
        },
        (error: unknown) => {
          const {cause} = error as {cause?: Error};
          assert.match(cause?.message ?? '', /point outside/);
          return true;
        },
      );
      assert.ok(
        !fs.existsSync(path.join(tmpDir, 'browser', 'evil-link')),
        'symlink pointing outside the target directory was created',
      );
    });
  });

  describe('extractTarXzWithLib', () => {
    it('extracts every entry with its structure and contents', async () => {
      await extractTarXzWithLib(path.join(fixturesPath, 'test.tar.xz'), tmpDir);
      assertTestArchiveUnpacked();
    });

    // Node.js does not honor POSIX permission bits on Windows.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves owner permissions',
      async () => {
        await extractTarXzWithLib(
          path.join(fixturesPath, 'test.tar.xz'),
          tmpDir,
        );
        assertTarOwnerPermissions();
      },
    );

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves symlinks',
      async () => {
        await extractTarXzWithLib(
          path.join(fixturesPath, 'test-symlink.tar.xz'),
          tmpDir,
        );
        assertTarSymlink();
      },
    );

    // modern-tar validates the target before creating the symlink, so the
    // rejection can be checked on Windows too.
    it('rejects symlinks that point outside the target directory', async () => {
      await assert.rejects(
        () => {
          return extractTarXzWithLib(
            path.join(fixturesPath, 'test-symlink-escape.tar.xz'),
            tmpDir,
          );
        },
        (error: unknown) => {
          assert.match(
            (error as Error).message,
            /points outside the extraction directory/,
          );
          return true;
        },
      );
      assert.ok(
        !fs.existsSync(path.join(tmpDir, 'test', 'evil')),
        'symlink pointing outside the target directory was created',
      );
    });
  });

  // When the `xz` utility is unavailable, extraction falls back to the optional
  // `xz-decompress` dependency rather than failing.
  it('falls back to xz-decompress when the xz utility is missing', async () => {
    await withoutXzUtility(() => {
      return unpackArchive(path.join(fixturesPath, 'test.tar.xz'), tmpDir);
    });
    assertTestArchiveUnpacked();
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
