/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {spawnSync, spawn, execFile} from 'node:child_process';
import {constants, createReadStream, createWriteStream} from 'node:fs';
import {lstat, mkdir, readdir, symlink} from 'node:fs/promises';
import * as path from 'node:path';
import {Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {promisify} from 'node:util';

import type {Entry, Options, ZipFile} from 'yauzl';

import {DEBUG_PREFIXES, type Logger} from './debug.js';

const execFileAsync = promisify(execFile);

/**
 * @internal
 */
export async function unpackArchive(
  archivePath: string,
  folderPath: string,
  logger?: Logger,
): Promise<void> {
  const outcome = await unpackArchiveWithCleanupState(
    archivePath,
    folderPath,
    logger,
  );
  if (outcome.status === 'error') {
    throw outcome.error;
  }
}

/**
 * `isSafeToCleanup` tracks resources that this module can observe directly,
 * such as extractor processes and DMG mounts. Third-party extractors may still
 * have internal filesystem operations that are not exposed through their
 * public completion boundary, so attempt removal remains best effort.
 *
 * @internal
 */
export type ArchiveUnpackOutcome =
  | {status: 'success'; isSafeToCleanup: boolean}
  | {status: 'error'; error: unknown; isSafeToCleanup: boolean};

/**
 * @internal
 */
export async function unpackArchiveWithCleanupState(
  archivePath: string,
  folderPath: string,
  logger?: Logger,
): Promise<ArchiveUnpackOutcome> {
  if (!path.isAbsolute(folderPath)) {
    folderPath = path.resolve(process.cwd(), folderPath);
  }
  try {
    if (archivePath.endsWith('.zip')) {
      await mkdir(folderPath, {recursive: true});
      await extractZip(archivePath, folderPath, logger);
    } else if (archivePath.endsWith('.tar.bz2')) {
      await extractTar(archivePath, folderPath, 'bzip2', logger);
    } else if (archivePath.endsWith('.dmg')) {
      await mkdir(folderPath);
      return await installDMG(archivePath, folderPath, logger);
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
    return {status: 'success', isSafeToCleanup: true};
  } catch (error) {
    return {status: 'error', error, isSafeToCleanup: true};
  }
}

/**
 * @internal
 */
export const internalConstantsForTesting: {
  xz: string;
  bzip2: string;
  dmgDetachAttempts: number;
  dmgDetachRetryDelay: number;
  dmgExecFile: (
    file: string,
    args: readonly string[],
  ) => Promise<{stdout: string; stderr: string}>;
  dmgReaddir: (path: string) => Promise<string[]>;
  delay: (milliseconds: number) => Promise<void>;
} = {
  xz: 'xz',
  bzip2: 'bzip2',
  dmgDetachAttempts: 3,
  dmgDetachRetryDelay: 1000,
  dmgExecFile: async (file, args) => {
    return await execFileAsync(file, args);
  },
  dmgReaddir: async directory => {
    return await readdir(directory);
  },
  delay: async (milliseconds: number): Promise<void> => {
    await new Promise(resolve => {
      setTimeout(resolve, milliseconds);
    });
  },
};

/**
 * @internal
 */
async function extractTar(
  tarPath: string,
  folderPath: string,
  decompressUtilityName: 'xz' | 'bzip2',
  logger?: Logger,
): Promise<void> {
  const {unpackTar} = await import('modern-tar/fs');
  const unpack = spawn(
    internalConstantsForTesting[decompressUtilityName],
    ['-d'],
    {
      stdio: ['pipe', 'pipe', 'inherit'],
    },
  );
  const source = createReadStream(tarPath);
  const tar = unpackTar(folderPath);
  let firstError: Error | undefined;
  let spawnError: Error | undefined;

  const stopProducer = (error: Error): void => {
    firstError ??= error;
    source.destroy();
    unpack.stdin.destroy();
    unpack.stdout.destroy();
    tar.destroy();
    if (
      unpack.pid !== undefined &&
      unpack.exitCode === null &&
      unpack.signalCode === null
    ) {
      try {
        unpack.kill();
      } catch {
        // The close event remains the process-quiescence boundary.
      }
    }
  };

  const childClosed = new Promise<{
    code: number | null;
    signal: NodeJS.Signals | null;
  }>(resolve => {
    unpack.once('error', error => {
      spawnError = normalizeUtilityError(error, decompressUtilityName);
      stopProducer(spawnError);
    });
    unpack.once('close', (code, signal) => {
      logger?.(DEBUG_PREFIXES.fileUtil)?.(
        `${decompressUtilityName} exited, code=${code}, signal=${signal}`,
      );
      resolve({code, signal});
    });
  });

  const input = pipeline(source, unpack.stdin).catch(error => {
    stopProducer(error as Error);
    throw error;
  });
  const output = pipeline(unpack.stdout, tar).catch(error => {
    stopProducer(error as Error);
    throw error;
  });
  const [inputResult, outputResult, childResult] = await Promise.allSettled([
    input,
    output,
    childClosed,
  ]);

  if (spawnError) {
    throw spawnError;
  }
  if (childResult.status === 'rejected') {
    throw childResult.reason;
  }
  if (childResult.value.code !== null && childResult.value.code !== 0) {
    throw new Error(
      `\`${decompressUtilityName}\` exited with ` +
        `code ${childResult.value.code}`,
    );
  }
  if (firstError) {
    throw firstError;
  }
  if (inputResult.status === 'rejected') {
    throw inputResult.reason;
  }
  if (outputResult.status === 'rejected') {
    throw outputResult.reason;
  }
  if (childResult.value.signal) {
    throw new Error(
      `\`${decompressUtilityName}\` exited with signal ${childResult.value.signal}`,
    );
  }
}

function normalizeUtilityError(error: Error, utilityName: string): Error {
  if ('code' in error && error.code === 'ENOENT') {
    return new Error(
      `\`${utilityName}\` utility is required to unpack this archive`,
      {
        cause: error,
      },
    );
  }
  return error;
}

/**
 * @internal
 */
async function installDMG(
  dmgPath: string,
  folderPath: string,
  logger?: Logger,
): Promise<ArchiveUnpackOutcome> {
  let stdout: string;
  try {
    ({stdout} = await internalConstantsForTesting.dmgExecFile('hdiutil', [
      'attach',
      '-nobrowse',
      '-noautoopen',
      dmgPath,
    ]));
  } catch (error) {
    return {status: 'error', error, isSafeToCleanup: true};
  }

  const volumes = stdout.match(/\/Volumes\/(.*)/m);
  if (!volumes) {
    return {
      status: 'error',
      error: new Error(`Could not find volume path in ${stdout}`),
      // hdiutil reported a successful attach, but without an identity there is
      // no way to confirm that the mounted resource was released.
      isSafeToCleanup: false,
    };
  }
  const mountPath = volumes[0]!;

  let primaryOutcome: ArchiveUnpackOutcome;
  try {
    const fileNames = await internalConstantsForTesting.dmgReaddir(mountPath);
    const appName = fileNames.find(item => {
      return typeof item === 'string' && item.endsWith('.app');
    });
    if (!appName) {
      throw new Error(`Cannot find app in ${mountPath}`);
    }
    const mountedPath = path.join(mountPath!, appName);

    await internalConstantsForTesting.dmgExecFile('cp', [
      '-R',
      mountedPath,
      folderPath,
    ]);
    primaryOutcome = {status: 'success', isSafeToCleanup: false};
  } catch (error) {
    primaryOutcome = {status: 'error', error, isSafeToCleanup: false};
  }

  const isSafeToCleanup = await detachDMG(mountPath, logger);
  return {...primaryOutcome, isSafeToCleanup};
}

async function detachDMG(mountPath: string, logger?: Logger): Promise<boolean> {
  const attempts = internalConstantsForTesting.dmgDetachAttempts;
  for (let attempt = 1; attempt <= attempts; ++attempt) {
    try {
      await internalConstantsForTesting.dmgExecFile('hdiutil', [
        'detach',
        mountPath,
        '-quiet',
      ]);
      return true;
    } catch (error) {
      logger?.(DEBUG_PREFIXES.fileUtil)?.(
        `Failed to detach DMG mount ${mountPath} ` +
          `(attempt ${attempt}/${attempts}): ${String(error)}`,
      );
      if (attempt < attempts) {
        await internalConstantsForTesting.delay(
          internalConstantsForTesting.dmgDetachRetryDelay,
        );
      }
    }
  }
  logger?.(DEBUG_PREFIXES.fileUtil)?.(
    `Retaining DMG mount after ${attempts} failed detach attempts: ${mountPath}`,
  );
  return false;
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
  logger?: Logger,
): Promise<void> {
  for (const extract of [extractZipWithCli, extractZipWithYauzl]) {
    try {
      await extract(archivePath, folderPath, logger);
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
export async function extractZipWithYauzl(
  archivePath: string,
  folderPath: string,
  _logger?: Logger,
): Promise<void> {
  const {default: yauzl} = await import(
    /* webpackIgnore: true */ 'yauzl'
  ).catch(() => {
    throw new ArchiverUnavailableError(
      'Extraction failed: The optional `yauzl` dependency is not installed.',
    );
  });
  const open = promisify<string, Options, ZipFile>(yauzl.open);
  try {
    const zipFile = await open(archivePath, {lazyEntries: true});
    let activeEntry: Promise<void> | undefined;
    let failed = false;
    const archiveClosed = new Promise<void>(resolve => {
      zipFile.once('close', resolve);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const fail = (error: unknown): void => {
          failed = true;
          reject(error);
        };

        zipFile
          .on('error', fail)
          .on('end', resolve)
          .on('entry', entry => {
            activeEntry = extractZipEntry(zipFile, entry, folderPath);
            void activeEntry.then(() => {
              if (!failed) {
                zipFile.readEntry();
              }
            }, fail);
          })
          .readEntry();
      });
    } finally {
      zipFile.close();
      // Archive close can precede an active entry's output completion.
      await Promise.allSettled([activeEntry, archiveClosed]);
    }
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
  logger?: Logger,
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
        logger?.(DEBUG_PREFIXES.fileUtil)?.(
          `tar.exe extraction failed: ${tarError}`,
        );
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
        logger?.(DEBUG_PREFIXES.fileUtil)?.(
          `powershell.exe extraction failed: ${powershellError}`,
        );
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
 * Checks that `linkTarget` is relative, uses `..` only as leading segments,
 * and climbs at most `depth` directories (staying within the extraction root).
 */
function isValidSymlinkTarget(linkTarget: string, depth: number): boolean {
  if (
    !linkTarget ||
    path.isAbsolute(linkTarget) ||
    /^[a-zA-Z]:/.test(linkTarget)
  ) {
    return false;
  }
  let descended = false;
  for (const part of linkTarget.split(/[/\\]+/)) {
    if (part === '..') {
      if (descended || depth === 0) {
        return false;
      }
      depth--;
    } else if (part.length > 0 && part !== '.') {
      descended = true;
    }
  }
  return true;
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

  const parts = entry.fileName.split(/[/\\]+/).filter(part => {
    return part.length > 0 && part !== '.';
  });
  if (parts.length === 0) {
    if (isDirectory) {
      await mkdir(folderPath, {recursive: true, mode});
      return;
    }
    throw new Error(`Zip entry "${entry.fileName}" has an empty path.`);
  }

  let current = folderPath;
  for (const part of parts) {
    current = path.join(current, part);
    const stats = await lstat(current).catch(() => {
      return undefined;
    });
    if (!stats) {
      break;
    }
    if (stats.isSymbolicLink()) {
      throw new Error(
        `Zip entry "${entry.fileName}" would be extracted through a symlink.`,
      );
    }
  }

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
    // Consume the symlink target in pipe semantics rather than via async
    // iteration (e.g. stream/consumers `text()`): yauzl <3.3.1 read streams
    // never emit "close", which hangs consumers (thejoshwolfe/yauzl#169)
    const chunks: Buffer[] = [];
    await pipeline(
      readStream,
      new Writable({
        write(chunk: unknown, _encoding, callback) {
          // yauzl opens entries in binary mode, so chunks are always Buffers.
          if (chunk instanceof Buffer) {
            chunks.push(chunk);
          }
          callback();
        },
      }),
    );
    const linkTarget = Buffer.concat(chunks).toString();
    // Verify that the link does not resolve outside of the target directory.
    if (!isValidSymlinkTarget(linkTarget, parts.length - 1)) {
      throw new Error(
        `Zip symlink "${entry.fileName}" would point outside of the target directory.`,
      );
    }
    await symlink(linkTarget, destination);
    return;
  }
  await pipeline(readStream, createWriteStream(destination, {mode}));
}
