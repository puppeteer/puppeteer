/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {spawnSync, spawn} from 'child_process';
import {createReadStream, createWriteStream} from 'fs';
import {mkdir, readdir} from 'fs/promises';
import * as path from 'path';
import {Stream} from 'stream';

import debug from 'debug';
import tar from 'tar-fs';
import bzip from 'unbzip2-stream';
import type {ZipFile} from 'yauzl';

const debugUnzip = debug('puppeteer:browsers:unzip');

/**
 * @internal
 */
export async function extractZip(
  archivePath: string,
  folderPath: string,
): Promise<void> {
  const yauzl = await import('yauzl');
  const zipfile: ZipFile = await new Promise((resolve, reject) => {
    yauzl.open(
      archivePath,
      {
        lazyEntries: true,
        autoClose: true,
      },
      (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(zipfile);
      },
    );
  });
  try {
    let resultError: Error | undefined | null;
    async function ensureDir(dest: string, mode = 0): Promise<void> {
      mode = mode === 0 ? 0o755 : mode;
      try {
        debugUnzip(`creating a dir: ${dest} using ${mode.toString(8)}`);
        await mkdir(dest, {
          recursive: true,
          mode,
        });
      } catch (error) {
        resultError = error as Error;
        zipfile.close();
        return;
      }
    }
    await ensureDir(folderPath);
    zipfile.on('entry', async entry => {
      const dest = path.join(folderPath, entry.fileName);
      const mode = (entry.externalFileAttributes >> 16) & 0o777;
      debugUnzip(`processing entry: ${dest} mode=${mode.toString(8)}`);
      if (entry.fileName.startsWith('__MACOSX/')) {
        zipfile.readEntry();
      } else if (entry.fileName.endsWith('/')) {
        // directory
        await ensureDir(dest, mode);
        zipfile.readEntry();
      } else {
        // files
        zipfile.openReadStream(entry, async (err, readStream) => {
          if (err) {
            resultError = err;
            zipfile.close();
            return;
          }
          await ensureDir(path.dirname(dest));
          try {
            const fileMode = mode === 0 ? 0o644 : mode;
            debugUnzip(`writing a file: ${dest} using ${fileMode.toString(8)}`);
            const output = createWriteStream(dest, {
              mode: fileMode,
            });
            readStream.on('end', () => {
              zipfile.readEntry();
            });
            readStream.on('error', err => {
              debugUnzip(`error piping content to ${dest}`);
              resultError = err;
              zipfile.close();
            });
            readStream.pipe(output);
          } catch (error) {
            debugUnzip(`error creating a write stream`, error);
            resultError = error as Error;
            zipfile.close();
            return;
          }
        });
      }
    });
    await new Promise<void>((resolve, reject) => {
      zipfile.once('close', () => {
        debugUnzip(`zipfile closed`, resultError);
        if (resultError) {
          reject(resultError);
        } else {
          resolve();
        }
      });
      zipfile.once('error', error => {
        debugUnzip(`zipfile errored`, error);
        resultError = error;
        zipfile.close();
        reject(error);
      });
      // Start reading entries.
      zipfile.readEntry();
    });
  } catch (cause) {
    throw new Error(`Failed to extract ${archivePath} to ${folderPath}`, {
      cause,
    });
  } finally {
    zipfile.close();
  }
}

/**
 * @internal
 */
export async function unpackArchive(
  archivePath: string,
  folderPath: string,
): Promise<void> {
  if (!path.isAbsolute(folderPath)) {
    folderPath = path.resolve(process.cwd(), folderPath);
  }

  if (archivePath.endsWith('.zip')) {
    await extractZip(archivePath, folderPath);
  } else if (archivePath.endsWith('.tar.bz2')) {
    await extractTar(archivePath, folderPath);
  } else if (archivePath.endsWith('.dmg')) {
    await mkdir(folderPath);
    await installDMG(archivePath, folderPath);
  } else if (archivePath.endsWith('.exe')) {
    // Firefox on Windows.
    const result = spawnSync(archivePath, [`/ExtractDir=${folderPath}`], {
      env: {
        __compat_layer: 'RunAsInvoker',
      },
    });
    if (result.status !== 0) {
      throw new Error(
        `Failed to extract ${archivePath} to ${folderPath}: ${result.output}`,
      );
    }
  } else if (archivePath.endsWith('.tar.xz')) {
    await extractTarXz(archivePath, folderPath);
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

/**
 * @internal
 */
function extractTar(tarPath: string, folderPath: string): Promise<void> {
  return new Promise((fulfill, reject) => {
    const tarStream = tar.extract(folderPath);
    tarStream.on('error', reject);
    tarStream.on('finish', fulfill);
    const readStream = createReadStream(tarPath);
    readStream.pipe(bzip()).pipe(tarStream);
  });
}

/**
 * @internal
 */
function createXzStream() {
  const child = spawn('xz', ['-d']);
  const stream = new Stream.Transform({
    transform(chunk, encoding, callback) {
      if (!child.stdin.write(chunk, encoding)) {
        child.stdin.once('drain', callback);
      } else {
        callback();
      }
    },

    flush(callback) {
      if (child.stdout.destroyed) {
        callback();
      } else {
        child.stdin.end();
        child.stdout.on('close', callback);
      }
    },
  });

  child.stdin.on('error', e => {
    if ('code' in e && e.code === 'EPIPE') {
      // finished before reading the file finished (i.e. head)
      stream.emit('end');
    } else {
      stream.destroy(e);
    }
  });

  child.stdout
    .on('data', data => {
      return stream.push(data);
    })
    .on('error', e => {
      return stream.destroy(e);
    });

  return stream;
}

/**
 * @internal
 */
function extractTarXz(tarPath: string, folderPath: string): Promise<void> {
  return new Promise((fulfill, reject) => {
    const tarStream = tar.extract(folderPath);
    tarStream.on('error', reject);
    tarStream.on('finish', fulfill);
    const readStream = createReadStream(tarPath);
    readStream.pipe(createXzStream()).pipe(tarStream);
  });
}

/**
 * @internal
 */
async function installDMG(dmgPath: string, folderPath: string): Promise<void> {
  const {stdout} = spawnSync(`hdiutil`, [
    'attach',
    '-nobrowse',
    '-noautoopen',
    dmgPath,
  ]);

  const volumes = stdout.toString('utf8').match(/\/Volumes\/(.*)/m);
  if (!volumes) {
    throw new Error(`Could not find volume path in ${stdout}`);
  }
  const mountPath = volumes[0]!;

  try {
    const fileNames = await readdir(mountPath);
    const appName = fileNames.find(item => {
      return typeof item === 'string' && item.endsWith('.app');
    });
    if (!appName) {
      throw new Error(`Cannot find app in ${mountPath}`);
    }
    const mountedPath = path.join(mountPath!, appName);

    spawnSync('cp', ['-R', mountedPath, folderPath]);
  } finally {
    spawnSync('hdiutil', ['detach', mountPath, '-quiet']);
  }
}
