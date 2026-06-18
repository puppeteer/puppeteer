/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcessByStdio} from 'node:child_process';
import {spawnSync, spawn, execFile} from 'node:child_process';
import {constants, createReadStream, createWriteStream} from 'node:fs';
import {mkdir, readdir, symlink} from 'node:fs/promises';
import * as path from 'node:path';
import type {Readable, Transform, Writable} from 'node:stream';
import {Stream} from 'node:stream';
import {text} from 'node:stream/consumers';
import {pipeline} from 'node:stream/promises';
import {promisify} from 'node:util';

import type {Entry, Options, ZipFile} from 'yauzl';

import {debug} from './debug.js';

const execFileAsync = promisify(execFile);
const debugFileUtil = debug('puppeteer:browsers:fileUtil');

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
    await mkdir(folderPath, {recursive: true});
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
  const {unpackTar} = await import('modern-tar/fs');
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
        debugFileUtil?.(`${decompressUtilityName} exited, code=${code}`);
      });

    const tar = unpackTar(folderPath);
    tar.once('error', handleError('tar'));
    tar.once('finish', fulfill);
    createReadStream(tarPath).pipe(createTransformStream(unpack)).pipe(tar);
  });
}

/**
 * @internal
 */
async function installDMG(dmgPath: string, folderPath: string): Promise<void> {
  const {stdout} = await execFileAsync('hdiutil', [
    'attach',
    '-nobrowse',
    '-noautoopen',
    dmgPath,
  ]);

  const volumes = stdout.match(/\/Volumes\/(.*)/m);
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

    await execFileAsync('cp', ['-R', mountedPath, folderPath]);
  } finally {
    await execFileAsync('hdiutil', ['detach', mountPath, '-quiet']);
  }
}

/**
 * @internal
 */
class ArchiverUnavailableError extends Error {}

/**
 * @internal
 */
async function extractZip(
  archivePath: string,
  folderPath: string,
): Promise<void> {
  for (const extract of [extractZipWithCli, extractZipWithYauzl]) {
    try {
      await extract(archivePath, folderPath);
      return;
    } catch (error) {
      if (!(error instanceof ArchiverUnavailableError)) {
        throw error;
      }
    }
  }
  throw new Error(
    `Extraction failed: no zip archiver is available. Install \`unzip\` (or \`tar.exe\`/Powershell on Windows), or add the optional \`yauzl\` dependency.`,
  );
}

/**
 * @internal
 */
async function extractZipWithYauzl(
  archivePath: string,
  folderPath: string,
): Promise<void> {
  const {default: yauzl} = await import('yauzl').catch(() => {
    throw new ArchiverUnavailableError(
      'Extraction failed: The optional `yauzl` dependency is not installed.',
    );
  });
  const open = promisify<string, Options, ZipFile>(yauzl.open);
  try {
    const zipFile = await open(archivePath, {lazyEntries: true});
    await new Promise((resolve, reject) => {
      zipFile
        .on('error', reject)
        .on('end', resolve)
        .on('entry', entry => {
          extractZipEntry(zipFile, entry, folderPath).then(() => {
            zipFile.readEntry();
          }, reject);
        })
        .readEntry();
    });
  } catch (error) {
    throw new Error(`Extraction failed: ${archivePath}`, {cause: error});
  }
}

/**
 * @internal
 */
async function extractZipWithCli(
  archivePath: string,
  folderPath: string,
): Promise<void> {
  try {
    if (process.platform === 'win32') {
      const systemRoot =
        process.env['SystemRoot'] ?? process.env['SYSTEMROOT'] ?? 'C:\\Windows';
      try {
        const systemTar = `${systemRoot}\\System32\\tar.exe`;
        // -x: extract files
        // -f: specify the archive file
        // -C: extract to the specified directory
        await execFileAsync(systemTar, ['-xf', archivePath, '-C', folderPath]);
        return;
      } catch (tarError) {
        debugFileUtil?.(`tar.exe extraction failed: ${tarError}`);
      }
      try {
        await execFileAsync('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-Command',
          '& { Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force }',
          archivePath,
          folderPath,
        ]);
        return;
      } catch (powershellError) {
        debugFileUtil?.(`powershell.exe extraction failed: ${powershellError}`);
      }
      await execFileAsync('pwsh.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '& { Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force }',
        archivePath,
        folderPath,
      ]);
    } else {
      // -o: overwrite existing files without prompting
      // -d: extract files into the specified directory
      await execFileAsync('unzip', ['-o', archivePath, '-d', folderPath]);
    }
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new ArchiverUnavailableError(
        `Extraction failed: Required native binary ('tar.exe', 'powershell.exe', 'pwsh.exe' or 'unzip') was not found in the system PATH.`,
      );
    }
    throw new Error(
      `Extraction failed: ${error?.stderr?.toString() || error?.message}`,
    );
  }
}

/**
 * @internal
 */
async function extractZipEntry(
  zipFile: ZipFile,
  entry: Entry,
  folderPath: string,
): Promise<void> {
  const {S_IFMT, S_IFDIR, S_IFLNK} = constants;

  // see https://github.com/max-mapper/extract-zip/blob/v2.0.1/index.js#L90-L107
  const unixMode = entry.externalFileAttributes >>> 16;
  const isDirectory =
    (unixMode & S_IFMT) === S_IFDIR ||
    entry.fileName.endsWith('/') ||
    (entry.versionMadeBy >> 8 === 0 && entry.externalFileAttributes === 0x10);
  const isSymlink = (unixMode & S_IFMT) === S_IFLNK;
  // Fall back to sensible defaults for archives without Unix attributes.
  const mode =
    unixMode === 0 ? (isDirectory ? 0o755 : 0o644) : unixMode & 0o777;

  const destination = path.join(folderPath, entry.fileName);
  if (isDirectory) {
    await mkdir(destination, {recursive: true, mode});
    return;
  }
  await mkdir(path.dirname(destination), {recursive: true});

  const readStream = await promisify(zipFile.openReadStream.bind(zipFile))(
    entry,
  );
  if (isSymlink) {
    await symlink(await text(readStream), destination);
    return;
  }
  await pipeline(readStream, createWriteStream(destination, {mode}));
}
