/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';

export const INSTALL_MARKER_FILE = '.puppeteer-install';

/**
 * @internal
 */
export interface InstallMarker {
  version: 1;
  relativeExecutablePath: string;
}

/**
 * @internal
 */
export interface ValidatedInstallMarker extends InstallMarker {
  executablePath: string;
}

/**
 * @internal
 */
export class InvalidInstallMarkerError extends Error {}

/**
 * Reads and validates an installation-local completion marker. A missing
 * marker identifies a legacy installation and is reported as `undefined`.
 *
 * @internal
 */
export function readInstallMarker(
  installationDir: string,
): ValidatedInstallMarker | undefined {
  const markerPath = path.join(installationDir, INSTALL_MARKER_FILE);
  let markerStat: fs.Stats;
  try {
    markerStat = fs.lstatSync(markerPath);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return;
    }
    throw invalidMarker(markerPath, error);
  }
  if (!markerStat.isFile()) {
    throw invalidMarker(markerPath, 'the marker is not a regular file');
  }

  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(markerPath, 'utf8'));
  } catch (error) {
    throw invalidMarker(markerPath, error);
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw invalidMarker(markerPath, 'the marker is not a JSON object');
  }

  const marker = value as Record<string, unknown>;
  if (marker['version'] !== 1) {
    throw invalidMarker(markerPath, 'unsupported marker version');
  }
  const relativeExecutablePath = marker['relativeExecutablePath'];
  if (
    typeof relativeExecutablePath !== 'string' ||
    relativeExecutablePath.length === 0
  ) {
    throw invalidMarker(
      markerPath,
      'relativeExecutablePath must be a non-empty string',
    );
  }

  const executablePath = validateExecutablePath(
    installationDir,
    relativeExecutablePath,
  );
  return {
    version: 1,
    relativeExecutablePath,
    executablePath,
  };
}

/**
 * Writes the completion marker without replacing an archive-provided entry.
 * The executable must already be complete when this function is called.
 *
 * @internal
 */
export function writeInstallMarker(
  installationDir: string,
  relativeExecutablePath: string,
): void {
  const markerPath = path.join(installationDir, INSTALL_MARKER_FILE);
  validateExecutablePath(installationDir, relativeExecutablePath);
  const marker: InstallMarker = {
    version: 1,
    relativeExecutablePath,
  };
  fs.writeFileSync(markerPath, JSON.stringify(marker), {flag: 'wx'});
}

/**
 * Validates an executable without writing a completion marker.
 *
 * @internal
 */
export function validateExecutablePath(
  installationDir: string,
  relativeExecutablePath: string,
): string {
  const markerPath = path.join(installationDir, INSTALL_MARKER_FILE);
  if (path.isAbsolute(relativeExecutablePath)) {
    throw invalidMarker(markerPath, 'the executable path is absolute');
  }

  const installationRoot = path.resolve(installationDir);
  const executablePath = path.resolve(installationRoot, relativeExecutablePath);
  if (!isWithin(installationRoot, executablePath)) {
    throw invalidMarker(
      markerPath,
      'the executable path escapes the installation root',
    );
  }

  let canonicalRoot: string;
  let canonicalExecutablePath: string;
  try {
    canonicalRoot = fs.realpathSync(installationRoot);
    canonicalExecutablePath = fs.realpathSync(executablePath);
  } catch (error) {
    throw invalidMarker(markerPath, error);
  }
  if (!isWithin(canonicalRoot, canonicalExecutablePath)) {
    throw invalidMarker(
      markerPath,
      'the executable resolves outside the installation root',
    );
  }

  try {
    if (!fs.statSync(executablePath).isFile()) {
      throw invalidMarker(
        markerPath,
        'the executable target is not a regular file',
      );
    }
  } catch (error) {
    if (error instanceof InvalidInstallMarkerError) {
      throw error;
    }
    throw invalidMarker(markerPath, error);
  }
  return executablePath;
}

function isWithin(root: string, target: string): boolean {
  const relativePath = path.relative(root, target);
  return (
    relativePath === '' ||
    (!path.isAbsolute(relativePath) &&
      relativePath !== '..' &&
      !relativePath.startsWith(`..${path.sep}`))
  );
}

function invalidMarker(
  markerPath: string,
  cause: unknown,
): InvalidInstallMarkerError {
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new InvalidInstallMarkerError(
    `Invalid install marker at ${markerPath}: ${detail}`,
  );
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
