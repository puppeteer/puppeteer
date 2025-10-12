/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execSync} from 'node:child_process';
import path from 'node:path';

import semver from 'semver';

import {getJSON} from '../httpUtil.js';

import {BrowserPlatform, ChromeReleaseChannel} from './types.js';

function folder(platform: BrowserPlatform): string {
  switch (platform) {
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      return 'linux64';
    case BrowserPlatform.MAC_ARM:
      return 'mac-arm64';
    case BrowserPlatform.MAC:
      return 'mac-x64';
    case BrowserPlatform.WIN32:
      return 'win32';
    case BrowserPlatform.WIN64:
      return 'win64';
  }
}

export function resolveDownloadUrl(
  platform: BrowserPlatform,
  buildId: string,
  baseUrl = 'https://storage.googleapis.com/chrome-for-testing-public',
): string {
  return `${baseUrl}/${resolveDownloadPath(platform, buildId).join('/')}`;
}

export function resolveDownloadPath(
  platform: BrowserPlatform,
  buildId: string,
): string[] {
  return [buildId, folder(platform), `chrome-${folder(platform)}.zip`];
}

export function relativeExecutablePath(
  platform: BrowserPlatform,
  _buildId: string,
): string {
  switch (platform) {
    case BrowserPlatform.MAC:
    case BrowserPlatform.MAC_ARM:
      return path.join(
        'chrome-' + folder(platform),
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing',
      );
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      return path.join('chrome-linux64', 'chrome');
    case BrowserPlatform.WIN32:
    case BrowserPlatform.WIN64:
      return path.join('chrome-' + folder(platform), 'chrome.exe');
  }
}

export async function getLastKnownGoodReleaseForChannel(
  channel: ChromeReleaseChannel,
): Promise<{version: string; revision: string}> {
  const data = (await getJSON(
    new URL(
      'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
    ),
  )) as {
    channels: Record<string, {version: string}>;
  };

  for (const channel of Object.keys(data.channels)) {
    data.channels[channel.toLowerCase()] = data.channels[channel]!;
    delete data.channels[channel];
  }

  return (
    data as {
      channels: Record<
        ChromeReleaseChannel,
        {version: string; revision: string}
      >;
    }
  ).channels[channel];
}

export async function getLastKnownGoodReleaseForMilestone(
  milestone: string,
): Promise<{version: string; revision: string} | undefined> {
  const data = (await getJSON(
    new URL(
      'https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone.json',
    ),
  )) as {
    milestones: Record<string, {version: string; revision: string}>;
  };
  return data.milestones[milestone] as
    | {version: string; revision: string}
    | undefined;
}

export async function getLastKnownGoodReleaseForBuild(
  /**
   * @example `112.0.23`,
   */
  buildPrefix: string,
): Promise<{version: string; revision: string} | undefined> {
  const data = (await getJSON(
    new URL(
      'https://googlechromelabs.github.io/chrome-for-testing/latest-patch-versions-per-build.json',
    ),
  )) as {
    builds: Record<string, {version: string; revision: string}>;
  };
  return data.builds[buildPrefix] as
    | {version: string; revision: string}
    | undefined;
}

export async function resolveBuildId(
  channel: ChromeReleaseChannel,
): Promise<string>;
export async function resolveBuildId(
  channel: string,
): Promise<string | undefined>;
export async function resolveBuildId(
  channel: ChromeReleaseChannel | string,
): Promise<string | undefined> {
  if (
    Object.values(ChromeReleaseChannel).includes(
      channel as ChromeReleaseChannel,
    )
  ) {
    return (
      await getLastKnownGoodReleaseForChannel(channel as ChromeReleaseChannel)
    ).version;
  }
  if (channel.match(/^\d+$/)) {
    // Potentially a milestone.
    return (await getLastKnownGoodReleaseForMilestone(channel))?.version;
  }
  if (channel.match(/^\d+\.\d+\.\d+$/)) {
    // Potentially a build prefix without the patch version.
    return (await getLastKnownGoodReleaseForBuild(channel))?.version;
  }
  return;
}
const WINDOWS_ENV_PARAM_NAMES = [
  'PROGRAMFILES',
  'ProgramW6432',
  'ProgramFiles(x86)',
  // https://source.chromium.org/chromium/chromium/src/+/main:chrome/installer/mini_installer/README.md
  'LOCALAPPDATA',
];

function getChromeWindowsLocation(
  channel: ChromeReleaseChannel,
  locationsPrefixes: Set<string>,
): [string, ...string[]] {
  if (locationsPrefixes.size === 0) {
    throw new Error('Non of the common Windows Env variables were set');
  }

  let suffix: string;
  switch (channel) {
    case ChromeReleaseChannel.STABLE:
      suffix = 'Google\\Chrome\\Application\\chrome.exe';
      break;
    case ChromeReleaseChannel.BETA:
      suffix = 'Google\\Chrome Beta\\Application\\chrome.exe';
      break;
    case ChromeReleaseChannel.CANARY:
      suffix = 'Google\\Chrome SxS\\Application\\chrome.exe';
      break;
    case ChromeReleaseChannel.DEV:
      suffix = 'Google\\Chrome Dev\\Application\\chrome.exe';
      break;
  }

  return [...locationsPrefixes.values()].map(l => {
    return path.win32.join(l, suffix);
  }) as [string, ...string[]];
}

function getWslLocation(channel: ChromeReleaseChannel): [string, ...string[]] {
  const wslVersion = execSync('wslinfo --version', {
    stdio: ['ignore', 'pipe', 'ignore'],
    encoding: 'utf-8',
  }).trim();
  if (!wslVersion) {
    throw new Error('Not in WSL or unsupported version of WSL.');
  }
  const wslPrefixes = new Set<string>();
  for (const name of WINDOWS_ENV_PARAM_NAMES) {
    try {
      // The Windows env for the paths are not passed down
      // to WSL, so we evoke `cmd.exe` which is usually on the PATH
      // from which the env can be access with all uppercase names.
      // The return value is a Windows Path - `C:\Program Files`.

      const wslPrefix = execSync(
        `cmd.exe /c echo %${name.toLocaleUpperCase()}%`,
        {
          // We need to ignore the stderr as cmd.exe
          // prints a message about wrong UNC path not supported.
          stdio: ['ignore', 'pipe', 'ignore'],
          encoding: 'utf-8',
        },
      ).trim();
      if (wslPrefix) {
        wslPrefixes.add(wslPrefix);
      }
    } catch {}
  }

  const windowsPath = getChromeWindowsLocation(channel, wslPrefixes);

  return windowsPath.map(path => {
    // The above command returned the Windows paths `C:\Program Files\...\chrome.exe`
    // Use the `wslpath` utility tool to transform into the mounted disk
    return execSync(`wslpath "${path}"`).toString().trim();
  }) as [string, ...string[]];
}

function getChromeLinuxOrWslLocation(
  channel: ChromeReleaseChannel,
): [string, ...string[]] {
  const locations: string[] = [];

  try {
    const wslPath = getWslLocation(channel);
    if (wslPath) {
      locations.push(...wslPath);
    }
  } catch {
    // Ignore WSL errors
  }

  switch (channel) {
    case ChromeReleaseChannel.STABLE:
      locations.push('/opt/google/chrome/chrome');
      break;
    case ChromeReleaseChannel.BETA:
      locations.push('/opt/google/chrome-beta/chrome');
      break;
    case ChromeReleaseChannel.CANARY:
      locations.push('/opt/google/chrome-canary/chrome');
      break;
    case ChromeReleaseChannel.DEV:
      locations.push('/opt/google/chrome-unstable/chrome');
      break;
  }

  return locations as [string, ...string[]];
}

export function resolveSystemExecutablePaths(
  platform: BrowserPlatform,
  channel: ChromeReleaseChannel,
): [string, ...string[]] {
  switch (platform) {
    case BrowserPlatform.WIN64:
    case BrowserPlatform.WIN32:
      const prefixLocation = new Set<string>(
        WINDOWS_ENV_PARAM_NAMES.map(name => {
          return process.env[name];
        }).filter((l): l is string => {
          return !!l;
        }),
      );
      // Fallbacks in case env vars are misconfigured.
      prefixLocation.add('C:\\Program Files');
      prefixLocation.add('C:\\Program Files (x86)');
      prefixLocation.add('D:\\Program Files');
      prefixLocation.add('D:\\Program Files (x86)');
      return getChromeWindowsLocation(channel, prefixLocation);
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          ];
        case ChromeReleaseChannel.BETA:
          return [
            '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
          ];
        case ChromeReleaseChannel.CANARY:
          return [
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
          ];
        case ChromeReleaseChannel.DEV:
          return [
            '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
          ];
      }
    case BrowserPlatform.LINUX_ARM:
    case BrowserPlatform.LINUX:
      return getChromeLinuxOrWslLocation(channel);
  }
}

export function compareVersions(a: string, b: string): number {
  if (!semver.valid(a)) {
    throw new Error(`Version ${a} is not a valid semver version`);
  }
  if (!semver.valid(b)) {
    throw new Error(`Version ${b} is not a valid semver version`);
  }
  if (semver.gt(a, b)) {
    return 1;
  } else if (semver.lt(a, b)) {
    return -1;
  } else {
    return 0;
  }
}
