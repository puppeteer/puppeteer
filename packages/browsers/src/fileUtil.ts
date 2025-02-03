/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcessByStdio} from 'child_process';
import {spawnSync, spawn} from 'child_process';
import {createReadStream, createWriteStream} from 'fs';
import {mkdir, readdir} from 'fs/promises';
import * as path from 'path';
import type {Readable, Transform, Writable} from 'stream';
import {Stream} from 'stream';

import debug from 'debug';
import type {ZipFile} from 'yauzl';

const debugFileUtil = debug('puppeteer:browsers:fileUtil');

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
        debugFileUtil(`creating a dir: ${dest} using ${mode.toString(8)}`);
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
      debugFileUtil(`processing entry: ${dest} mode=${mode.toString(8)}`);
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
            debugFileUtil(
              `writing a file: ${dest} using ${fileMode.toString(8)}`,
            );
            const output = createWriteStream(dest, {
              mode: fileMode,
            });
            readStream.on('end', () => {
              zipfile.readEntry();
            });
            readStream.on('error', err => {
              debugFileUtil(`error piping content to ${dest}`);
              resultError = err;
              zipfile.close();
            });
            readStream.pipe(output);
          } catch (error) {
            debugFileUtil(`error creating a write stream`, error);
            resultError = error as Error;
            zipfile.close();
            return;
          }
        });
      }
    });
    await new Promise<void>((resolve, reject) => {
      zipfile.once('close', () => {
        debugFileUtil(`zipfile closed`, resultError);
        if (resultError) {
          reject(resultError);
        } else {
          resolve();
        }
      });
      zipfile.once('error', error => {
        debugFileUtil(`zipfile errored`, error);
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
    await extractTar(archivePath, folderPath, 'bzip2');
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
    await extractTar(archivePath, folderPath, 'xz');
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

function createTransformStream(
  child: ChildProcessByStdio<Writable, Readable, null>,
): Transform {
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

  child.once('close', () => {
    return stream.end();
  });

  return stream;
}

/**
 * @internal
 */
export const internalConstantsForTesting = {
  xz: 'xz',
  bzip2: 'bzip2',
};

/**
 * @internal
 */
async function extractTar(
  tarPath: string,
  folderPath: string,
  decompressUtilityName: keyof typeof internalConstantsForTesting,
): Promise<void> {
  const tarFs = await import('tar-fs');
  return await new Promise<void>((fulfill, reject) => {
    function handleError(utilityName: string) {
      return (error: Error) => {
        if ('code' in error && error.code === 'ENOENT') {
          error = new Error(
            `\`${utilityName}\` utility is required to unpack this archive`,
            {
              cause: error,
            },
          );
        }
        reject(error);
      };
    }
    const unpack = spawn(
      internalConstantsForTesting[decompressUtilityName],
      ['-d'],
      {
        stdio: ['pipe', 'pipe', 'inherit'],
      },
    )
      .once('error', handleError(decompressUtilityName))
      .once('exit', code => {
        debugFileUtil(`${decompressUtilityName} exited, code=${code}`);
      });

    const tar = tarFs.extract(folderPath);
    tar.once('error', handleError('tar'));
    tar.once('finish', fulfill);
    createReadStream(tarPath).pipe(createTransformStream(unpack)).pipe(tar);
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
