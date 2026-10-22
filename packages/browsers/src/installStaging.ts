/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import {
  link,
  lstat,
  mkdir,
  mkdtemp,
  rename,
  rm,
  unlink,
} from 'node:fs/promises';
import path from 'node:path';

import {readInstallMarker} from './installMarker.js';

const INSTALL_ATTEMPT_CLEANUP_MAX_RETRIES = 5;
const INSTALL_ATTEMPT_CLEANUP_RETRY_DELAY = 100;

/**
 * @internal
 */
export class AmbiguousInstallPublicationError extends Error {}

/**
 * @internal
 */
export class InstallArchivePublicationError extends Error {}

/**
 * @internal
 */
export class InvalidInstallTreeError extends Error {}

/**
 * @internal
 */
export interface InstallAttempt {
  path: string;
  archivePath: string;
  outputPath: string;
}

/**
 * @internal
 */
export const internalConstantsForTesting: {
  link: typeof link;
  rm: (
    path: string,
    options: {
      recursive: true;
      force: true;
      maxRetries: number;
      retryDelay: number;
    },
  ) => Promise<void>;
} = {
  link,
  rm,
};

/**
 * @internal
 */
export async function createInstallAttempt(
  browserRoot: string,
  archiveSuffix = '',
): Promise<InstallAttempt> {
  await mkdir(browserRoot, {recursive: true});
  const stagingRoot = path.join(browserRoot, '.staging');
  await mkdir(stagingRoot, {recursive: true});
  const stagingStat = await lstat(stagingRoot);
  if (!stagingStat.isDirectory() || stagingStat.isSymbolicLink()) {
    throw new Error(`Staging path is not a regular directory: ${stagingRoot}`);
  }
  const attemptPath = await mkdtemp(path.join(stagingRoot, 'install-'));
  return {
    path: attemptPath,
    archivePath: path.join(attemptPath, `archive${archiveSuffix}`),
    outputPath: path.join(attemptPath, 'output'),
  };
}

/**
 * Publishes a completed install tree. A valid new-protocol winner is preserved
 * and reported as `winner`.
 *
 * @internal
 */
export async function publishInstallTree(
  outputPath: string,
  installationDir: string,
): Promise<'published' | 'winner'> {
  const maxAttempts = process.platform === 'win32' ? 5 : 1;
  for (let attempt = 1; ; attempt++) {
    const existing = inspectPublicationWinner(installationDir);
    if (existing) {
      return existing;
    }
    try {
      await rename(outputPath, installationDir);
      return 'published';
    } catch (error) {
      const winner = inspectPublicationWinner(installationDir);
      if (winner) {
        return winner;
      }
      if (
        attempt >= maxAttempts ||
        !isWindowsRenameContentionError(error) ||
        !(await isRegularDirectory(outputPath))
      ) {
        throw error;
      }
      await delay(attempt * 50);
    }
  }
}

/**
 * Publishes a completed archive without replacing an existing canonical file.
 *
 * @internal
 */
export async function publishInstallArchive(
  privateArchivePath: string,
  archivePath: string,
): Promise<void> {
  try {
    await internalConstantsForTesting.link(privateArchivePath, archivePath);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'EEXIST') {
      throw new AmbiguousInstallPublicationError(
        `The archive ${archivePath} appeared while the installation was in progress. ` +
          'Wait for the other installation to finish and retry.',
      );
    }
    throw new InstallArchivePublicationError(
      `Failed to publish the completed archive ${archivePath} using a hard link. ` +
        'Archive-only installation requires hard-link support from the cache filesystem.',
      {cause: error},
    );
  }
  try {
    await unlink(privateArchivePath);
  } catch {
    // The attempt cleanup removes the remaining private hard link. The
    // canonical archive is already complete and must remain the primary result.
  }
}

/**
 * @internal
 */
export async function removeInstallAttempt(attemptPath: string): Promise<void> {
  await internalConstantsForTesting.rm(attemptPath, {
    recursive: true,
    force: true,
    maxRetries: INSTALL_ATTEMPT_CLEANUP_MAX_RETRIES,
    retryDelay: INSTALL_ATTEMPT_CLEANUP_RETRY_DELAY,
  });
}

function inspectPublicationWinner(
  installationDir: string,
): 'winner' | undefined {
  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(installationDir);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }
  // Unlike an initial cache hit, a winner encountered during publication
  // must be a regular directory, even when a link has a valid marker.
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new InvalidInstallTreeError(
      `Installation path is not a regular directory: ${installationDir}`,
    );
  }
  const marker = readInstallMarker(installationDir);
  if (marker) {
    return 'winner';
  }
  throw new AmbiguousInstallPublicationError(
    `The browser folder ${installationDir} appeared without an install marker ` +
      'while the installation was in progress. Wait for the other installation ' +
      'to finish and retry.',
  );
}

async function isRegularDirectory(directoryPath: string): Promise<boolean> {
  try {
    const stat = await lstat(directoryPath);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function isWindowsRenameContentionError(error: unknown): boolean {
  return (
    process.platform === 'win32' &&
    isErrnoException(error) &&
    (error.code === 'EPERM' ||
      error.code === 'EBUSY' ||
      error.code === 'EACCES')
  );
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

async function delay(milliseconds: number): Promise<void> {
  await new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}
