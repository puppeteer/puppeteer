/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';

import semver from 'semver';

import {getJSON} from '../httpUtil.js';

import {BrowserPlatform, ChromeReleaseChannel} from './types.js';

function folder(platform: BrowserPlatform): string {
  switch (platform) {
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

export function resolveSystemExecutablePath(
  platform: BrowserPlatform,
  channel: ChromeReleaseChannel,
): string {
  switch (platform) {
    case BrowserPlatform.WIN64:
    case BrowserPlatform.WIN32:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`;
        case ChromeReleaseChannel.BETA:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome Beta\\Application\\chrome.exe`;
        case ChromeReleaseChannel.CANARY:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome SxS\\Application\\chrome.exe`;
        case ChromeReleaseChannel.DEV:
          return `${process.env['PROGRAMFILES']}\\Google\\Chrome Dev\\Application\\chrome.exe`;
      }
    case BrowserPlatform.MAC_ARM:
    case BrowserPlatform.MAC:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        case ChromeReleaseChannel.BETA:
          return '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
        case ChromeReleaseChannel.CANARY:
          return '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
        case ChromeReleaseChannel.DEV:
          return '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
      }
    case BrowserPlatform.LINUX:
      switch (channel) {
        case ChromeReleaseChannel.STABLE:
          return '/opt/google/chrome/chrome';
        case ChromeReleaseChannel.BETA:
          return '/opt/google/chrome-beta/chrome';
        case ChromeReleaseChannel.CANARY:
          return '/opt/google/chrome-canary/chrome';
        case ChromeReleaseChannel.DEV:
          return '/opt/google/chrome-unstable/chrome';
      }
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
