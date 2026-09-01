/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execFile as execFileCallback} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import semver from 'semver';

const execFile = promisify(execFileCallback);
const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoDir = path.resolve(toolsDir, '..');
const defaultWebsiteDir = path.join(defaultRepoDir, 'website');
const puppeteerCoreRevisionsPath = 'packages/puppeteer-core/src/revisions.ts';

export interface BrowserVersions {
  chrome: string;
  firefox: string;
}

export interface BrowserVersionData {
  versions: Array<[string, BrowserVersions]>;
}

export function parseRevisions(content: string): BrowserVersions {
  const chromeMatch = /(?:['"]chrome['"]|\bchrome)\s*:\s*['"]([^'"]+)['"]/.exec(
    content,
  );
  const firefoxMatch =
    /(?:['"]firefox['"]|\bfirefox)\s*:\s*['"]([^'"]+)['"]/.exec(content);
  if (!chromeMatch?.[1] || !firefoxMatch?.[1]) {
    throw new Error('Failed to parse revisions from revisions.ts');
  }
  return {
    chrome: chromeMatch[1],
    firefox: firefoxMatch[1],
  };
}

export async function git(
  args: string[],
  cwd = defaultRepoDir,
): Promise<string> {
  const {stdout} = await execFile('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

let fetchQueue = Promise.resolve();

export async function ensureRefs(
  refs: string[],
  cwd = defaultRepoDir,
): Promise<void> {
  const missingRefs: string[] = [];
  for (const ref of refs) {
    try {
      await git(['rev-parse', '--verify', `${ref}^{commit}`], cwd);
    } catch {
      missingRefs.push(ref);
    }
  }

  if (missingRefs.length === 0) {
    return;
  }

  const runFetch = async () => {
    const stillMissing: string[] = [];
    for (const ref of missingRefs) {
      try {
        await git(['rev-parse', '--verify', `${ref}^{commit}`], cwd);
      } catch {
        stillMissing.push(ref);
      }
    }

    if (stillMissing.length === 0) {
      return;
    }

    const refspecs = stillMissing.map(ref => {
      const tag = ref.startsWith('refs/tags/')
        ? ref.slice('refs/tags/'.length)
        : ref;
      return `+refs/tags/${tag}:refs/tags/${tag}`;
    });
    try {
      await git(
        ['fetch', '--depth=1', '--no-tags', 'origin', ...refspecs],
        cwd,
      );
    } catch {
      // If fetch fails (e.g. offline or origin unreachable), continue to
      // check if refs can be resolved.
    }

    for (const ref of stillMissing) {
      try {
        await git(['rev-parse', '--verify', `${ref}^{commit}`], cwd);
      } catch {
        throw new Error(`Git ref does not exist: ${ref}`);
      }
    }
  };

  const nextFetch = fetchQueue.then(runFetch, runFetch);
  fetchQueue = nextFetch.catch(() => {});
  await nextFetch;
}

export async function ensureRef(
  ref: string,
  cwd = defaultRepoDir,
): Promise<void> {
  await ensureRefs([ref], cwd);
}

export async function getReleaseTags(cwd = defaultRepoDir): Promise<string[]> {
  let localTags = '';
  try {
    localTags = await git(['tag', '--list', 'puppeteer-v*'], cwd);
  } catch {
    // Gracefully ignore local tag listing error
  }

  let remoteTags = '';
  try {
    remoteTags = await git(
      ['ls-remote', '--tags', '--refs', 'origin', 'refs/tags/puppeteer-v*'],
      cwd,
    );
  } catch {
    // Gracefully ignore remote error (e.g. offline, remote unreachable)
  }

  if (!localTags.trim() && !remoteTags.trim()) {
    throw new Error('Unable to list local or remote Puppeteer release tags.');
  }

  const rawTags = [...localTags.split('\n'), ...remoteTags.split('\n')]
    .map(line => {
      return line.trim();
    })
    .filter(Boolean)
    .map(line => {
      return line.split(/\s+/).at(-1)!;
    })
    .map(ref => {
      return ref.replace(/^refs\/tags\//, '');
    })
    .filter(tag => {
      return tag.startsWith('puppeteer-v');
    })
    .map(tag => {
      return tag.slice('puppeteer-v'.length);
    })
    .filter((version): version is string => {
      return semver.valid(version) !== null;
    });

  return Array.from(new Set(rawTags)).sort(semver.rcompare);
}

export function deduplicateBrowserVersions(
  versions: Array<[string, BrowserVersions]>,
): Array<[string, BrowserVersions]> {
  if (versions.length <= 1) {
    return [...versions];
  }

  const ascending = [...versions].reverse();
  const retained: Array<[string, BrowserVersions]> = [];

  for (let i = 0; i < ascending.length; i++) {
    const current = ascending[i];
    if (!current) {
      continue;
    }
    const isLatest = i === ascending.length - 1;

    if (retained.length === 0) {
      retained.push(current);
      continue;
    }

    const last = retained[retained.length - 1];
    if (!last) {
      retained.push(current);
      continue;
    }
    const hasChanged =
      current[1].chrome !== last[1].chrome ||
      current[1].firefox !== last[1].firefox;

    if (hasChanged) {
      retained.push(current);
    } else if (isLatest) {
      retained[retained.length - 1] = current;
    }
  }

  return retained.reverse();
}

export async function getSupportedBrowserData(options?: {
  repoDir?: string;
  websiteDir?: string;
  release?: {ref: string; version: string};
  tags?: string[];
}): Promise<BrowserVersionData> {
  const repoDir = options?.repoDir ?? defaultRepoDir;
  const websiteDir = options?.websiteDir ?? defaultWebsiteDir;

  const tags = options?.tags ?? (await getReleaseTags(repoDir));

  const v25Versions = tags.filter(version => {
    return semver.gte(version, '25.0.0');
  });

  const release = options?.release;
  if (
    release &&
    semver.gte(release.version, '25.0.0') &&
    !v25Versions.includes(release.version)
  ) {
    v25Versions.push(release.version);
    v25Versions.sort(semver.rcompare);
  }

  const refs = v25Versions.map(version => {
    return release && version === release.version
      ? release.ref
      : `puppeteer-v${version}`;
  });
  await ensureRefs(refs, repoDir);

  const generatedVersions = await Promise.all(
    v25Versions.map(async version => {
      const ref =
        release && version === release.version
          ? release.ref
          : `puppeteer-v${version}`;
      const content = await git(
        ['show', `${ref}:${puppeteerCoreRevisionsPath}`],
        repoDir,
      );
      const revisions = parseRevisions(content);
      return [`v${version}`, revisions] as [string, BrowserVersions];
    }),
  );

  const preV25Data = JSON.parse(
    await readFile(path.join(websiteDir, 'versions-pre-v25.json'), 'utf-8'),
  ) as BrowserVersionData;

  const allVersions: Array<[string, BrowserVersions]> = [
    ...generatedVersions,
    ...preV25Data.versions,
  ];

  return {
    versions: deduplicateBrowserVersions(allVersions),
  };
}

function isAtLeast(version: string, major: number, minor = 0): boolean {
  const match = /^v?(\d+)\.(\d+)/.exec(version);
  if (!match) {
    throw new Error(`Invalid Puppeteer version: ${version}`);
  }
  const versionMajor = Number(match[1]);
  const versionMinor = Number(match[2]);
  return (
    versionMajor > major || (versionMajor === major && versionMinor >= minor)
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

export function getLastMaintainedVersion(
  versionData: BrowserVersionData,
): [string, BrowserVersions] | undefined {
  if (versionData.versions.length === 0) {
    return undefined;
  }
  const latestChromeVersion = versionData.versions[0][1].chrome;
  const latestMajor = new semver.SemVer(latestChromeVersion, true).major;
  const targetMajor = latestMajor - 3;
  return versionData.versions.find(([_puppeteerVersion, browserVersions]) => {
    return (
      new semver.SemVer(browserVersions.chrome, true).major === targetMajor
    );
  });
}
