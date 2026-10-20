/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import os from 'node:os';
import path from 'node:path';

import sinon from 'sinon';
import yauzl from 'yauzl';

import {
  extractZipWithYauzl,
  internalConstantsForTesting,
  unpackArchive,
  unpackArchiveWithCleanupState,
} from '../../lib/fileUtil.js';

import {createTestZip, testZipEntries, type TestZipEntry} from './zip.js';

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

  function assertTestZipUnpacked(targetDir: string): void {
    const entries = fs
      .readdirSync(targetDir, {recursive: true})
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
      fs.readFileSync(
        path.join(targetDir, 'browser/locales/en-US.pak'),
        'utf8',
      ),
      'resource',
    );
    assert.strictEqual(
      fs.readFileSync(path.join(targetDir, 'browser/product_logo.png'), 'utf8'),
      'logo',
    );
  }

  function assertOwnerPermissions(targetDir: string): void {
    const executable = fs.statSync(path.join(targetDir, 'browser/chrome')).mode;
    assert.strictEqual(executable & 0o700, 0o700);
    const regular = fs.statSync(
      path.join(targetDir, 'browser/product_logo.png'),
    ).mode;
    assert.strictEqual(regular & 0o700, 0o600);
  }

  function assertSymlink(targetDir: string): void {
    const link = path.join(targetDir, 'browser/Current');
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
    const archivePath = createTestZip(
      path.join(tmpDir, 'test.zip'),
      testZipEntries,
    );
    const targetDir = path.join(tmpDir, 'target');
    await unpackArchive(archivePath, targetDir);
    assertTestZipUnpacked(targetDir);
  });

  describe('extractZipWithYauzl', () => {
    afterEach(() => {
      sinon.restore();
    });

    it('extracts every entry with its structure and contents', async () => {
      const archivePath = createTestZip(
        path.join(tmpDir, 'test.zip'),
        testZipEntries,
      );
      const targetDir = path.join(tmpDir, 'target');
      await extractZipWithYauzl(archivePath, targetDir);
      assertTestZipUnpacked(targetDir);
    });

    it('resolves after closing the archive', async () => {
      const events = sinon.spy(yauzl.ZipFile.prototype, 'emit');
      const archivePath = path.join(tmpDir, 'archive.zip');
      const renamedPath = path.join(tmpDir, 'closed.zip');
      const outputPath = path.join(tmpDir, 'output');
      createTestZip(archivePath, testZipEntries);

      await extractZipWithYauzl(archivePath, outputPath);
      assert.ok(events.calledWith('close'), 'archive was not closed');
      fs.renameSync(archivePath, renamedPath);
    });

    it('closes the archive after an entry write fails', async () => {
      const events = sinon.spy(yauzl.ZipFile.prototype, 'emit');
      const outputPath = path.join(tmpDir, 'output');
      const blockedFile = path.join(outputPath, 'browser', 'chrome');
      fs.mkdirSync(blockedFile, {recursive: true});

      await assert.rejects(
        extractZipWithYauzl(
          createTestZip(path.join(tmpDir, 'archive.zip'), testZipEntries),
          outputPath,
        ),
        (error: unknown) => {
          const {cause} = error as {cause?: NodeJS.ErrnoException};
          assert.strictEqual(cause?.code, 'EISDIR');
          return true;
        },
      );
      assert.ok(events.calledWith('close'), 'archive was not closed');
      assert.ok(fs.statSync(blockedFile).isDirectory());
    });

    // Node.js does not honor POSIX permission bits on Windows.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves owner permissions',
      async () => {
        const archivePath = createTestZip(
          path.join(tmpDir, 'test.zip'),
          testZipEntries,
        );
        const targetDir = path.join(tmpDir, 'target');
        await extractZipWithYauzl(archivePath, targetDir);
        assertOwnerPermissions(targetDir);
      },
    );

    // Creating symlinks on Windows requires elevated privileges.
    (os.platform() === 'win32' ? it.skip : it)(
      'preserves symlinks',
      async () => {
        const archivePath = createTestZip(
          path.join(tmpDir, 'test-symlink.zip'),
          [
            {name: 'browser/', type: 'dir'},
            {
              name: 'browser/chrome',
              content: '#!/bin/sh\necho chrome\n',
              mode: 0o755,
            },
            {name: 'browser/Current', type: 'symlink', content: 'chrome'},
          ],
        );
        const targetDir = path.join(tmpDir, 'target');
        await extractZipWithYauzl(archivePath, targetDir);
        assertSymlink(targetDir);
      },
    );

    // The target is validated before any symlink is created, so unlike the
    // preceding symlink test the rejection can be checked on Windows too.
    it('rejects symlinks that point outside the target directory', async () => {
      const events = sinon.spy(yauzl.ZipFile.prototype, 'emit');
      const renamedPath = path.join(tmpDir, 'closed-escape.zip');
      const archivePath = createTestZip(
        path.join(tmpDir, 'test-symlink-escape.zip'),
        [
          {
            name: 'browser/evil-link',
            type: 'symlink',
            content: '../../../../../../../../../../etc/passwd',
          },
        ],
      );
      const targetDir = path.join(tmpDir, 'target');
      await assert.rejects(
        () => {
          return extractZipWithYauzl(archivePath, targetDir);
        },
        (error: unknown) => {
          const {cause} = error as {cause?: Error};
          assert.match(cause?.message ?? '', /point outside/);
          return true;
        },
      );
      assert.ok(events.calledWith('close'), 'archive was not closed');
      assert.ok(
        !fs.existsSync(path.join(targetDir, 'browser', 'evil-link')),
        'symlink pointing outside the target directory was created',
      );
      fs.renameSync(archivePath, renamedPath);
    });

    const frameworkEntries: TestZipEntry[] = [
      {
        name: 'Fw.framework/Resources',
        type: 'symlink',
        content: 'Versions/Current/Resources',
      },
      {
        name: 'Fw.framework/Versions/A/Libraries/lib.txt',
        content: 'lib',
      },
      {
        name: 'Fw.framework/Versions/A/Resources/r.txt',
        content: 'res',
      },
      {
        name: 'Fw.framework/Versions/A/Helpers/res',
        type: 'symlink',
        content: '../Resources',
      },
      {
        name: 'Fw.framework/Versions/Current',
        type: 'symlink',
        content: 'A',
      },
      {
        name: 'Fw.framework/Libraries',
        type: 'symlink',
        content: 'Versions/Current/Libraries',
      },
    ];

    (os.platform() === 'win32' ? it.skip : it)(
      'extracts symlink chains inside the target directory',
      async () => {
        const archivePath = createTestZip(
          path.join(tmpDir, 'framework.zip'),
          frameworkEntries,
        );
        const target = path.join(tmpDir, 'target');
        fs.mkdirSync(target, {recursive: true});
        await extractZipWithYauzl(archivePath, target);

        const framework = path.join(target, 'Fw.framework');
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

    const rejectedArchives: Array<{
      name: string;
      entries: TestZipEntry[];
      artifact?: string[];
      message: RegExp;
    }> = [
      {
        name: 'symlink chains routed through an earlier symlink',
        entries: [
          {name: 'browser', type: 'symlink', content: '.'},
          {name: 'browser/browser/link', type: 'symlink', content: '../..'},
          {name: 'link/escape.txt', content: 'escaped'},
        ],
        artifact: ['..', '..', 'escape.txt'],
        message: /through a symlink/,
      },
      {
        name: 'symlink targets that "../" out through an earlier symlink',
        entries: [
          {name: 'a', type: 'symlink', content: '.'},
          {name: 'f', type: 'symlink', content: 'a/../outside.txt'},
          {name: 'a/f', content: 'escaped'},
        ],
        artifact: ['..', 'outside.txt'],
        message: /point outside/,
      },
      {
        name: 'symlinks that would route a later directory entry outside',
        entries: [
          {name: 'a', type: 'symlink', content: '.'},
          {name: 'b', type: 'symlink', content: 'a/..'},
          {name: 'b/created-outside/', type: 'dir'},
        ],
        artifact: ['..', 'created-outside'],
        message: /point outside/,
      },
      {
        name: 'symlink targets routed outside by a later entry',
        entries: [
          {name: 'a', type: 'symlink', content: '.'},
          {name: 'esc', type: 'symlink', content: 'x/../a/..'},
          {name: 'x/', type: 'dir'},
        ],
        artifact: ['esc'],
        message: /point outside/,
      },
      {
        name: 'directory entries created through a symlink',
        entries: [
          {name: 'sub/', type: 'dir'},
          {name: 'a', type: 'symlink', content: 'sub'},
          {name: 'a/x/', type: 'dir'},
        ],
        artifact: ['sub', 'x'],
        message: /through a symlink/,
      },
      {
        name: 'files written through a symlink',
        entries: [
          {name: 'sub/', type: 'dir'},
          {name: 'n', type: 'symlink', content: 'sub/f'},
          {name: 'n', content: 'inside'},
        ],
        artifact: ['sub', 'f'],
        message: /through a symlink/,
      },
      {
        name: 'directory entries in symlink mode created through a symlink',
        entries: [
          {name: 'd/', type: 'dir'},
          {name: 's', type: 'symlink', content: 'd'},
          {name: 's/', type: 'symlink', content: 'd'},
        ],
        message: /through a symlink/,
      },
      {
        name: 'symlinks named "."',
        entries: [{name: '.', type: 'symlink', content: 'target/q'}],
        message: /empty path/,
      },
      {
        name: 'symlinks with an empty name',
        entries: [{name: '', type: 'symlink', content: 'target/q'}],
        message: /empty path/,
      },
      {
        name: 'files named "."',
        entries: [{name: '.', content: 'dot'}],
        message: /empty path/,
      },
      {
        name: 'absolute symlink targets',
        entries: [{name: 'l', type: 'symlink', content: '/tmp/chrome'}],
        artifact: ['l'],
        message: /point outside/,
      },
      {
        name: 'drive-letter symlink targets',
        entries: [{name: 'l', type: 'symlink', content: 'C:\\chrome'}],
        artifact: ['l'],
        message: /point outside/,
      },
    ];

    for (const {name, entries, artifact, message} of rejectedArchives) {
      (os.platform() === 'win32' ? it.skip : it)(
        `rejects ${name}`,
        async () => {
          const archivePath = createTestZip(
            path.join(tmpDir, 'test-rejected.zip'),
            entries,
          );
          const target = path.join(tmpDir, 'nested', 'target');
          fs.mkdirSync(target, {recursive: true});
          await assert.rejects(
            () => {
              return extractZipWithYauzl(archivePath, target);
            },
            (error: unknown) => {
              const {cause} = error as {cause?: Error};
              assert.match(cause?.message ?? '', message);
              return true;
            },
          );
          if (artifact) {
            const forbidden = path.join(target, ...artifact);
            assert.ok(
              !fs.lstatSync(forbidden, {throwIfNoEntry: false}),
              `${forbidden} was created`,
            );
          }
        },
      );
    }
  });

  describe('DMG cleanup', () => {
    const originalDmgExecFile = internalConstantsForTesting.dmgExecFile;
    const originalDmgReaddir = internalConstantsForTesting.dmgReaddir;
    const originalDelay = internalConstantsForTesting.delay;
    const originalDetachAttempts =
      internalConstantsForTesting.dmgDetachAttempts;
    const originalDetachRetryDelay =
      internalConstantsForTesting.dmgDetachRetryDelay;

    afterEach(() => {
      internalConstantsForTesting.dmgExecFile = originalDmgExecFile;
      internalConstantsForTesting.dmgReaddir = originalDmgReaddir;
      internalConstantsForTesting.delay = originalDelay;
      internalConstantsForTesting.dmgDetachAttempts = originalDetachAttempts;
      internalConstantsForTesting.dmgDetachRetryDelay =
        originalDetachRetryDelay;
    });

    it('retries detach and reports a released mount after a transient failure', async () => {
      let detachCalls = 0;
      let delayCalls = 0;
      internalConstantsForTesting.dmgReaddir = async () => {
        return ['Browser.app'];
      };
      internalConstantsForTesting.delay = async () => {
        ++delayCalls;
      };
      internalConstantsForTesting.dmgExecFile = async (file, args) => {
        if (file === 'cp') {
          return {stdout: '', stderr: ''};
        }
        if (args[0] === 'attach') {
          return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
        }
        if (args[0] === 'detach') {
          if (++detachCalls < 3) {
            throw new Error('resource busy');
          }
          return {stdout: '', stderr: ''};
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      };

      const outcome = await unpackArchiveWithCleanupState(
        path.join(tmpDir, 'browser.dmg'),
        path.join(tmpDir, 'output'),
      );

      assert.deepStrictEqual(outcome, {
        status: 'success',
        isSafeToCleanup: true,
      });
      assert.strictEqual(detachCalls, 3);
      assert.strictEqual(delayCalls, 2);
    });

    it('preserves copy success when detach retries are exhausted', async () => {
      let detachCalls = 0;
      const messages: string[] = [];
      internalConstantsForTesting.dmgReaddir = async () => {
        return ['Browser.app'];
      };
      internalConstantsForTesting.delay = async () => {};
      internalConstantsForTesting.dmgExecFile = async (file, args) => {
        if (file === 'cp') {
          return {stdout: '', stderr: ''};
        }
        if (args[0] === 'attach') {
          return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
        }
        if (args[0] === 'detach') {
          ++detachCalls;
          throw new Error('resource busy');
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      };

      const outcome = await unpackArchiveWithCleanupState(
        path.join(tmpDir, 'browser.dmg'),
        path.join(tmpDir, 'output'),
        () => {
          return (...args: unknown[]) => {
            messages.push(args.join(' '));
          };
        },
      );

      assert.deepStrictEqual(outcome, {
        status: 'success',
        isSafeToCleanup: false,
      });
      assert.strictEqual(detachCalls, 3);
      assert.ok(
        messages.some(message => {
          return message.includes('Retaining DMG mount');
        }),
      );
    });

    it('preserves the copy error when detach retries are exhausted', async () => {
      const copyError = new Error('copy failed');
      let detachCalls = 0;
      internalConstantsForTesting.dmgReaddir = async () => {
        return ['Browser.app'];
      };
      internalConstantsForTesting.delay = async () => {};
      internalConstantsForTesting.dmgExecFile = async (file, args) => {
        if (file === 'cp') {
          throw copyError;
        }
        if (args[0] === 'attach') {
          return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
        }
        if (args[0] === 'detach') {
          ++detachCalls;
          throw new Error('resource busy');
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      };

      const outcome = await unpackArchiveWithCleanupState(
        path.join(tmpDir, 'browser.dmg'),
        path.join(tmpDir, 'output'),
      );

      assert.strictEqual(outcome.status, 'error');
      if (outcome.status === 'error') {
        assert.strictEqual(outcome.error, copyError);
      }
      assert.strictEqual(outcome.isSafeToCleanup, false);
      assert.strictEqual(detachCalls, 3);
    });

    it('reports a failed copy as cleanup-safe after detach succeeds', async () => {
      const copyError = new Error('copy failed');
      internalConstantsForTesting.dmgReaddir = async () => {
        return ['Browser.app'];
      };
      internalConstantsForTesting.dmgExecFile = async (file, args) => {
        if (file === 'cp') {
          throw copyError;
        }
        if (args[0] === 'attach') {
          return {stdout: '/dev/disk1\t/Volumes/Browser\n', stderr: ''};
        }
        if (args[0] === 'detach') {
          return {stdout: '', stderr: ''};
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      };

      const outcome = await unpackArchiveWithCleanupState(
        path.join(tmpDir, 'browser.dmg'),
        path.join(tmpDir, 'output'),
      );

      assert.strictEqual(outcome.status, 'error');
      if (outcome.status === 'error') {
        assert.strictEqual(outcome.error, copyError);
      }
      assert.strictEqual(outcome.isSafeToCleanup, true);
    });
  });

  it('stops the decompressor and waits for close after a tar pipeline failure', async () => {
    const spawn = childProcess.spawn;
    // Keep the producer alive after emitting an invalid tar header so the
    // output pipeline failure must stop it. The timer bounds a broken test.
    const producer = spawn(process.execPath, [
      '-e',
      "process.stdin.resume(); process.stdout.write(Buffer.alloc(512, 'x')); setTimeout(() => process.exit(0), 5000);",
    ]);
    let closed = false;
    const childClosed = new Promise<void>(resolve => {
      producer.once('close', () => {
        closed = true;
        resolve();
      });
    });
    const kill = sinon.spy(producer, 'kill');
    const spawnStub = sinon.stub(childProcess, 'spawn').returns(producer);
    syncBuiltinESMExports();
    try {
      const outcome = await unpackArchiveWithCleanupState(
        path.join(fixturesPath, 'test.tar.xz'),
        path.join(tmpDir, 'output'),
      );

      assert.strictEqual(outcome.status, 'error');
      assert.ok(kill.called, 'producer was not stopped');
      assert.ok(closed, 'extraction settled before the producer closed');
      assert.strictEqual(outcome.isSafeToCleanup, true);
    } finally {
      spawnStub.restore();
      syncBuiltinESMExports();
      kill.restore();
      if (!closed) {
        producer.kill();
      }
      await childClosed;
    }
  });

  it('rejects a non-zero decompressor after closing the archive', async () => {
    const archivePath = path.join(tmpDir, 'input.tar.xz');
    const renamedPath = path.join(tmpDir, 'closed.tar.xz');
    const outputPath = path.join(tmpDir, 'output');
    // xz rejects this input before producing any tar data.
    fs.writeFileSync(archivePath, 'not an xz archive');
    await assert.rejects(
      unpackArchive(archivePath, outputPath),
      /`xz` exited with code 1/,
    );
    fs.renameSync(archivePath, renamedPath);
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
