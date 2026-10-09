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
  extractZipWithYauzl,
  internalConstantsForTesting,
  isSymlinkTargetInside,
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

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'extracts symlink chains inside the target directory',
      async () => {
        // Laid out like a macOS framework bundle, in the entry order of the
        // Chrome for Testing archive: "Libraries" goes through the earlier
        // symlink "Versions/Current", "Resources" comes before it.
        await extractZipWithYauzl(
          path.join(fixturesPath, 'test-symlink-framework.zip'),
          tmpDir,
        );
        const framework = path.join(tmpDir, 'Fw.framework');
        const read = (...parts: string[]) => {
          return fs.readFileSync(path.join(framework, ...parts), 'utf8');
        };
        assert.strictEqual(read('Libraries', 'lib.txt'), 'lib');
        assert.strictEqual(read('Resources', 'r.txt'), 'res');
        assert.strictEqual(
          read('Versions', 'A', 'Helpers', 'res', 'r.txt'),
          'res',
        );
      },
    );

    // A symlink target or an entry path can look inside the target directory
    // lexically while routing outside on disk through a symlink created by an
    // earlier or a later entry. Entries are never extracted through a symlink,
    // not even one that stays inside. Each archive below is extracted into a
    // nested target so that, were a regression to let it escape, the artifact
    // still lands inside the temporary directory and is cleaned up. `artifact`
    // is a path, relative to the target, that must not exist afterwards.
    // Creating symlinks on Windows requires elevated privileges, so these run
    // on POSIX only.
    const rejectedArchives = [
      {
        name: 'symlink chains routed through an earlier symlink',
        // browser -> . ; browser/browser/link -> ../.. ; file link/escape.txt
        fixture: 'test-symlink-escape-chain.zip',
        artifact: ['..', '..', 'escape.txt'],
        message: /through a symlink/,
      },
      {
        name: 'symlink targets that "../" out through an earlier symlink',
        // a -> . ; f -> a/../pwned.txt ; file a/f
        fixture: 'test-symlink-escape-bypass.zip',
        artifact: ['..', 'pwned.txt'],
        message: /point outside/,
      },
      {
        name: 'symlinks that would route a later directory entry outside',
        // a -> . ; b -> a/.. ; dir b/created-outside/
        fixture: 'test-symlink-escape-dir.zip',
        artifact: ['..', 'created-outside'],
        message: /point outside/,
      },
      {
        name: 'symlink targets routed outside by a later entry',
        // a -> . ; esc -> x/../a/.. ; dir x/
        // Once "x" exists, "esc" resolves to the parent of the target.
        fixture: 'test-symlink-escape-late-dir.zip',
        artifact: ['esc'],
        message: /point outside/,
      },
      {
        name: 'directory entries created through a symlink',
        // dir sub/ ; a -> sub ; dir a/x/
        fixture: 'test-symlink-through-dir.zip',
        artifact: ['sub', 'x'],
        message: /through a symlink/,
      },
      {
        name: 'files written through a symlink',
        // dir sub/ ; n -> sub/f ; file n
        fixture: 'test-symlink-through-file.zip',
        artifact: ['sub', 'f'],
        message: /through a symlink/,
      },
      {
        name: 'directory entries in symlink mode created through a symlink',
        // dir d/ ; s -> d ; s/ with symlink mode, extracted as a directory
        fixture: 'test-symlink-through-hybrid.zip',
        message: /through a symlink/,
      },
      {
        name: 'symlinks named "."',
        // . -> target/q
        fixture: 'test-symlink-dot.zip',
        message: /empty path/,
      },
      {
        name: 'symlinks with an empty name',
        // "" -> target/q
        fixture: 'test-symlink-empty-name.zip',
        message: /empty path/,
      },
      {
        name: 'files named "."',
        // file .
        fixture: 'test-file-dot.zip',
        message: /empty path/,
      },
    ];
    for (const {name, fixture, artifact, message} of rejectedArchives) {
      (os.platform() === 'win32' ? it.skip : it)(
        `rejects ${name}`,
        async () => {
          const target = path.join(tmpDir, 'nested', 'target');
          fs.mkdirSync(target, {recursive: true});
          await assert.rejects(
            () => {
              return extractZipWithYauzl(
                path.join(fixturesPath, fixture),
                target,
              );
            },
            (error: unknown) => {
              const {cause} = error as {cause?: Error};
              assert.match(cause?.message ?? '', message);
              return true;
            },
          );
          if (artifact) {
            // lstat, so that a dangling or escaping symlink is detected too.
            const forbidden = path.join(target, ...artifact);
            assert.ok(
              !fs.lstatSync(forbidden, {throwIfNoEntry: false}),
              `${forbidden} was created`,
            );
          }
        },
      );
    }

    // Returns a target directory reached through the symlink "v": the real
    // path of "v/target" is "d/r/target".
    function createSymlinkedTarget(): string {
      fs.mkdirSync(path.join(tmpDir, 'd', 'r', 'target'), {recursive: true});
      fs.symlinkSync(path.join('d', 'r'), path.join(tmpDir, 'v'));
      return path.join(tmpDir, 'v', 'target');
    }

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'extracts symlinks into a target directory reached through a symlink',
      async () => {
        const target = createSymlinkedTarget();
        await extractZipWithYauzl(
          path.join(fixturesPath, 'test-symlink-framework.zip'),
          target,
        );
        assert.strictEqual(
          fs.readFileSync(
            path.join(target, 'Fw.framework', 'Libraries', 'lib.txt'),
            'utf8',
          ),
          'lib',
        );
      },
    );

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'validates symlink targets against the real target directory',
      async () => {
        // Against the real path "d/r/target", the link target
        // "../../v/target/q" resolves to "d/v/target/q", outside the target,
        // although it looks inside when resolved against "v/target".
        const target = createSymlinkedTarget();
        await assert.rejects(
          () => {
            // l -> ../../v/target/q
            return extractZipWithYauzl(
              path.join(fixturesPath, 'test-symlink-escape-real-root.zip'),
              target,
            );
          },
          (error: unknown) => {
            const {cause} = error as {cause?: Error};
            assert.match(cause?.message ?? '', /point outside/);
            return true;
          },
        );
        assert.ok(
          !fs.lstatSync(path.join(target, 'l'), {throwIfNoEntry: false}),
          'symlink pointing outside the real target directory was created',
        );
      },
    );
  });

  describe('isSymlinkTargetInside', () => {
    function inside(linkTarget: string, parent: string[] = []): boolean {
      return isSymlinkTargetInside(
        tmpDir,
        path.join(tmpDir, ...parent),
        linkTarget,
      );
    }

    it('accepts relative targets that stay inside', () => {
      assert.ok(inside('.'));
      assert.ok(inside('chrome'));
      assert.ok(inside('Versions/Current/Libraries'));
      assert.ok(inside('../Resources', ['Versions', 'A']));
      assert.ok(inside('./../..', ['Versions', 'A']));
    });

    it('rejects targets that leave the target directory', () => {
      assert.ok(!inside('..'));
      assert.ok(!inside('../../..', ['Versions', 'A']));
      // A sibling whose name starts with the target directory's name.
      assert.ok(!inside(`../${path.basename(tmpDir)}-x/q`));
    });

    it('rejects ".." after a descending segment', () => {
      // "a" may be, or may later become, a symlink, so "a/.." cannot be
      // resolved before the archive is fully extracted.
      assert.ok(!inside('a/..'));
      assert.ok(!inside('x/../a/..'));
      assert.ok(!inside('../a/../b', ['Versions']));
      // Backslashes separate segments on Windows.
      assert.ok(!inside('a\\..'));
    });

    it('rejects absolute targets even if they look inside', () => {
      assert.ok(!inside(tmpDir));
      // Built by hand because path.join would collapse "a/..".
      assert.ok(!inside(`${tmpDir}${path.sep}a${path.sep}..`));
      assert.ok(!inside(path.join(tmpDir, 'chrome')));
      assert.ok(!inside('C:\\chrome'));
      assert.ok(!inside('C:chrome'));
    });
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
