/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import zlib from 'node:zlib';

export interface TestZipEntry {
  name: string;
  type?: 'file' | 'dir' | 'symlink';
  content?: string;
  mode?: number;
}

/**
 * Creates an uncompressed (STORE) PKZIP archive with Unix external file
 * attributes for testing zip extraction on the fly.
 */
export function createTestZipBuffer(entries: TestZipEntry[]): Buffer {
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

  return Buffer.concat([...localParts, centralDir, eocd]);
}

export function createTestZip(
  zipPath: string,
  entries: TestZipEntry[],
): string {
  fs.writeFileSync(zipPath, createTestZipBuffer(entries));
  return zipPath;
}

export const testZipEntries: TestZipEntry[] = [
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
