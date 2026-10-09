/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {ChildProcessByStdio} from 'node:child_process';
import {spawnSync, spawn, execFile} from 'node:child_process';
import {constants, createReadStream, createWriteStream} from 'node:fs';
import {lstat, mkdir, readdir, realpath, symlink} from 'node:fs/promises';
import * as path from 'node:path';
import type {Readable, Transform} from 'node:stream';
import {Stream, Writable} from 'node:stream';
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
  if (!path.isAbsolute(folderPath)) {
    folderPath = path.resolve(process.cwd(), folderPath);
  }
  if (archivePath.endsWith('.zip')) {
    await mkdir(folderPath, {recursive: true});
    await extractZip(archivePath, folderPath, logger);
  } else if (archivePath.endsWith('.tar.bz2')) {
    await extractTar(archivePath, folderPath, 'bzip2', logger);
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
  logger?: Logger,
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
        logger?.(DEBUG_PREFIXES.fileUtil)?.(
          `${decompressUtilityName} exited, code=${code}`,
        );
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
    // The real path of the target directory is the boundary symlink targets
    // are validated against. It is resolved once, and only when the archive
    // contains a symlink.
    let realRoot: Promise<string> | undefined;
    const getRealRoot = () => {
      realRoot ??= realpath(folderPath);
      return realRoot;
    };
    const zipFile = await open(archivePath, {lazyEntries: true});
    await new Promise((resolve, reject) => {
      zipFile
        .on('error', reject)
        .on('end', resolve)
        .on('entry', entry => {
          extractZipEntry(zipFile, entry, folderPath, getRealRoot).then(() => {
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
 * Walks the components of the entry path `relPath` under `baseDir` and
 * reports whether any component that already exists on disk is a symlink.
 * Extraction never creates or writes an entry by traversing a symlink. With
 * symlink targets validated by isSymlinkTargetInside this is defense in
 * depth; it also covers symlinks that were not created from the archive.
 *
 * Only meant for entry paths, which yauzl guarantees to be relative and free
 * of ".." segments, checked right before the entry is created.
 *
 * @internal
 */
async function pathTraversesSymlink(
  baseDir: string,
  relPath: string,
  includeFinal: boolean,
): Promise<boolean> {
  const parts = relPath.split(/[/\\]+/).filter(part => {
    return part.length > 0 && part !== '.';
  });
  let current = baseDir;
  for (let i = 0; i < parts.length; i++) {
    if (i === parts.length - 1 && !includeFinal) {
      break;
    }
    current = path.join(current, parts[i]!);
    let stats;
    try {
      stats = await lstat(current);
    } catch {
      // The component does not exist yet, so nothing beyond it can either.
      return false;
    }
    if (stats.isSymbolicLink()) {
      return true;
    }
  }
  return false;
}

/**
 * Reports whether the symlink target `linkTarget`, for a link created in the
 * real directory `realParent`, stays inside `realRoot` however later entries
 * fill in the components it names.
 *
 * The target is resolved by the OS when the link is used, not when it is
 * created, so its components cannot be checked against the disk at extraction
 * time. Instead the target must be relative and may use ".." only as leading
 * segments. The upward part then starts from `realParent`, a real directory,
 * and every following segment descends into a directory or through a symlink
 * that was itself accepted by this rule. A target that stays inside lexically
 * therefore stays inside on disk, independent of entry order. A segment such
 * as "a/.." is rejected because "a" may be, or may later become, a symlink.
 * In-tree chains such as macOS framework bundles
 * (`Libraries -> Versions/Current/Libraries`) are still accepted.
 *
 * This assumes that the target directory contained no symlinks before
 * extraction and that nothing else writes to it during extraction.
 *
 * @internal
 */
export function isSymlinkTargetInside(
  realRoot: string,
  realParent: string,
  linkTarget: string,
): boolean {
  // Mirror yauzl's file name validation: no absolute or drive-letter paths.
  if (path.isAbsolute(linkTarget) || /^[a-zA-Z]:/.test(linkTarget)) {
    return false;
  }
  let descended = false;
  for (const part of linkTarget.split(/[/\\]+/)) {
    if (part === '..') {
      if (descended) {
        return false;
      }
    } else if (part.length > 0 && part !== '.') {
      descended = true;
    }
  }
  return isInsideDirectory(realRoot, path.resolve(realParent, linkTarget));
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
 * @internal
 */
function isInsideDirectory(directory: string, candidate: string): boolean {
  const resolvedDirectory = path.resolve(directory);
  const resolvedCandidate = path.resolve(candidate);
  return (
    resolvedCandidate === resolvedDirectory ||
    resolvedCandidate.startsWith(resolvedDirectory + path.sep)
  );
}

/**
 * @internal
 */
async function extractZipEntry(
  zipFile: ZipFile,
  entry: Entry,
  folderPath: string,
  getRealRoot: () => Promise<string>,
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
  // A symlink entry whose name ends with "/" is extracted as a directory.
  const isLink = isSymlink && !isDirectory;

  // Reject any entry that would be created by traversing an existing symlink
  // (defense in depth, see pathTraversesSymlink). For a link the final
  // component is the link we are about to create, so it is excluded; for files
  // and directories it is included so a final component that already exists
  // as a symlink is not written through. This runs before any mkdir so a
  // rejected entry leaves nothing behind.
  if (await pathTraversesSymlink(folderPath, entry.fileName, !isLink)) {
    throw new Error(
      `Zip entry "${entry.fileName}" would be extracted through a symlink.`,
    );
  }
  // A link named "" or "." would be created in place of the target directory,
  // with its target resolved against the directory above it.
  if (isLink && path.resolve(destination) === path.resolve(folderPath)) {
    throw new Error(`Zip symlink "${entry.fileName}" has an empty path.`);
  }

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
    // Reject the link unless its target provably stays inside the target
    // directory, see isSymlinkTargetInside.
    const realParent = await realpath(path.dirname(destination));
    if (!isSymlinkTargetInside(await getRealRoot(), realParent, linkTarget)) {
      throw new Error(
        `Zip symlink "${entry.fileName}" may point outside of the target directory.`,
      );
    }
    await symlink(linkTarget, destination);
    return;
  }
  await pipeline(readStream, createWriteStream(destination, {mode}));
}
