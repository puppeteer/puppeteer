/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {existsSync} from 'node:fs';
import {
  link,
  readFile,
  realpath,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';

const markerName = '.puppeteer-installation.json';

/**
 * @internal
 */
export interface InstallationMarker {
  version: 1;
  executablePath: string;
  defaultProvider: boolean;
}

function isInside(directory: string, target: string): boolean {
  const relative = path.relative(directory, target);
  return (
    relative !== '' &&
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

async function validateExecutable(
  directory: string,
  executablePath: string,
): Promise<void> {
  const target = path.resolve(directory, executablePath);
  if (path.isAbsolute(executablePath) || !isInside(directory, target)) {
    throw new Error(`Invalid installation executable path: ${executablePath}`);
  }
  if (
    !isInside(await realpath(directory), await realpath(target)) ||
    !(await stat(target)).isFile()
  ) {
    throw new Error(`Invalid installation executable: ${target}`);
  }
}

/**
 * @internal
 */
export async function readInstallationMarker(
  directory: string,
): Promise<InstallationMarker | undefined> {
  let contents: string;
  try {
    contents = await readFile(path.join(directory, markerName), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }
  const marker: unknown = JSON.parse(contents);
  if (
    typeof marker !== 'object' ||
    marker === null ||
    !('version' in marker) ||
    marker.version !== 1 ||
    !('executablePath' in marker) ||
    typeof marker.executablePath !== 'string' ||
    !('defaultProvider' in marker) ||
    typeof marker.defaultProvider !== 'boolean'
  ) {
    throw new Error(`Invalid installation marker in ${directory}`);
  }
  await validateExecutable(directory, marker.executablePath);
  return {
    version: 1,
    executablePath: marker.executablePath,
    defaultProvider: marker.defaultProvider,
  };
}

/**
 * @internal
 */
export async function writeInstallationMarker(
  directory: string,
  marker: InstallationMarker,
): Promise<void> {
  await validateExecutable(directory, marker.executablePath);
  await writeFile(path.join(directory, markerName), JSON.stringify(marker), {
    flag: 'wx',
  });
}

/**
 * @internal
 */
export async function publishInstallation(
  stagedPath: string,
  outputPath: string,
): Promise<void> {
  if (existsSync(outputPath)) {
    return;
  }
  try {
    await rename(stagedPath, outputPath);
  } catch (error) {
    if (
      ['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(
        (error as NodeJS.ErrnoException).code ?? '',
      ) &&
      existsSync(outputPath)
    ) {
      return;
    }
    throw error;
  }
}

/**
 * @internal
 */
export async function publishArchive(
  stagedPath: string,
  archivePath: string,
): Promise<void> {
  try {
    await link(stagedPath, archivePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      return;
    }
    if (
      !['EXDEV', 'EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS'].includes(
        code ?? '',
      )
    ) {
      throw error;
    }
    if (!existsSync(archivePath)) {
      await rename(stagedPath, archivePath);
    }
  }
}
