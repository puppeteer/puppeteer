/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

interface BrowserVersions {
  chrome: string;
  firefox: string;
}

export interface BrowserVersionData {
  versions: Array<[string, BrowserVersions]>;
}

function isAtLeast(version: string, major: number, minor = 0): boolean {
  const match = /^v?(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Invalid Puppeteer version: ${version}`);
  }
  const versionMajor = Number(match[1]);
  const versionMinor = Number(match[2]);
  return (
    versionMajor > major ||
    (versionMajor === major && versionMinor >= minor)
  );
}

function getApiUrl(version: string): string {
  if (isAtLeast(version, 19, 3)) {
    return `https://github.com/puppeteer/puppeteer/blob/puppeteer-${version}/docs/api/index.md`;
  }
  if (isAtLeast(version, 15, 3)) {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api/index.md`;
  }
  return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api.md`;
}

export function generateSupportedBrowsersTable(
  versionData: BrowserVersionData,
  nextVersion?: string,
): string {
  const rows = [
    '| Puppeteer | Chrome | Firefox |',
    '| --------- | ------ | ------- |',
  ];

  for (const [storedVersion, browserVersions] of versionData.versions) {
    if (storedVersion === 'NEXT' && !nextVersion) {
      continue;
    }
    const version =
      storedVersion === 'NEXT' ? `v${nextVersion}` : storedVersion;
    const puppeteer = `[Puppeteer ${version}](${getApiUrl(version)})`;
    const firefox = isAtLeast(version, 23)
      ? `[Firefox](https://www.mozilla.org/en-US/firefox/) ${browserVersions.firefox.split('_').at(-1)}`
      : isAtLeast(version, 2, 1)
        ? 'Firefox Nightly (at the time)'
        : 'Firefox not supported';
    const chrome = isAtLeast(version, 20)
      ? `[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) ${browserVersions.chrome}`
      : `Chromium ${browserVersions.chrome}`;
    rows.push(`| ${puppeteer} | ${chrome} | ${firefox} |`);
  }

  return rows.join('\n');
}
