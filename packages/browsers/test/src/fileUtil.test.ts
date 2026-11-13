/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import {
  extractTarXzWithLib,
  extractZipWithYauzl,
  internalConstantsForTesting,
  unpackArchive,
} from '../../lib/fileUtil.js';

interface TestZipEntry {
  name: string;
  type?: 'file' | 'dir' | 'symlink';
  content?: string;
  mode?: number;
}

/**
 * Writes an uncompressed (STORE) PKZIP archive with Unix external file
 * attributes for testing zip extraction on the fly.
 */
function createTestZip(zipPath: string, entries: TestZipEntry[]): string {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const dataBuf = Buffer.from(entry.content ?? '', 'utf8');
    const crc = zlib.crc32(dataBuf);
    const kind = entry.type ?? (entry.name.endsWith('/') ? 'dir' : 'file');
    const fileTypeBits =
      kind === 'symlink'
        ? fs.constants.S_IFLNK
        : kind === 'dir'
          ? fs.constants.S_IFDIR
          : fs.constants.S_IFREG;
    const permBits =
      entry.mode ??
      (kind === 'symlink' ? 0o777 : kind === 'dir' ? 0o755 : 0o644);
    const unixMode = fileTypeBits | permBits;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x0021, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(dataBuf.length, 18);
    localHeader.writeUInt32LE(dataBuf.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuf, dataBuf);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE((3 << 8) | 20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x0021, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(dataBuf.length, 20);
    centralHeader.writeUInt32LE(dataBuf.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE((unixMode << 16) >>> 0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, nameBuf);

    localOffset += localHeader.length + nameBuf.length + dataBuf.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.writeFileSync(zipPath, Buffer.concat([...localParts, centralDir, eocd]));
  return zipPath;
}

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

  const testZipEntries: TestZipEntry[] = [
    {name: 'browser/', type: 'dir'},
    {name: 'browser/locales/', type: 'dir'},
    {name: 'browser/locales/en-US.pak', content: 'resource', mode: 0o644},
    {
      name: 'browser/chrome',
      content: '#!/bin/sh\necho chrome\n',
      mode: 0o755,
    },
    {name: 'browser/product_logo.png', content: 'logo', mode: 0o644},
  ];

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
    const archivePath = createTestZip(
      path.join(tmpDir, 'test.zip'),
      testZipEntries,
    );
    const targetDir = path.join(tmpDir, 'target');
    await unpackArchive(archivePath, targetDir);
    assertTestZipUnpacked(targetDir);
  });

  describe('extractZipWithYauzl', () => {
    it('extracts every entry with its structure and contents', async () => {
      const archivePath = createTestZip(
        path.join(tmpDir, 'test.zip'),
        testZipEntries,
      );
      const targetDir = path.join(tmpDir, 'target');
      await extractZipWithYauzl(archivePath, targetDir);
      assertTestZipUnpacked(targetDir);
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
      assert.ok(
        !fs.existsSync(path.join(targetDir, 'browser', 'evil-link')),
        'symlink pointing outside the target directory was created',
      );
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
