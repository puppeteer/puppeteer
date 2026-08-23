/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execFile as execFileCallback} from 'node:child_process';
import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import semver from 'semver';

import {mergeChangelogs} from '../tools/merge-changelogs.ts';

const execFile = promisify(execFileCallback);
const websiteDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(websiteDir, '..');
const generatedDir = path.join(websiteDir, '.generated-docs');
const nextDocsDir = path.join(generatedDir, 'next');
const releaseSourceDir = path.join(generatedDir, 'release-source');
const releaseDocsDir = path.join(releaseSourceDir, 'docs');

const puppeteerChangelogPath = 'packages/puppeteer/CHANGELOG.md';
const puppeteerCoreChangelogPath = 'packages/puppeteer-core/CHANGELOG.md';

interface BrowserVersions {
  chrome: string;
  firefox: string;
}

interface VersionData {
  versions: Array<[string, BrowserVersions]>;
}

interface Release {
  ref: string;
  version: string;
}

async function git(args: string[]): Promise<string> {
  const {stdout} = await execFile('git', args, {
    cwd: repoDir,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout.trim();
}

async function ensureRef(ref: string): Promise<void> {
  try {
    await git(['rev-parse', '--verify', `${ref}^{commit}`]);
    return;
  } catch {
    if (!/^puppeteer-v\d+\.\d+\.\d+$/.test(ref)) {
      throw new Error(`Git ref does not exist: ${ref}`);
    }
  }
  await git([
    'fetch',
    '--depth=1',
    'origin',
    `refs/tags/${ref}:refs/tags/${ref}`,
  ]);
}

async function getRelease(): Promise<Release> {
  const requestedRef = process.env['DOCS_RELEASE_REF'];
  if (requestedRef) {
    await ensureRef(requestedRef);
    const packageJson = JSON.parse(
      await git(['show', `${requestedRef}:packages/puppeteer/package.json`]),
    ) as {version: string};
    const version = process.env['DOCS_RELEASE_VERSION'] ?? packageJson.version;
    if (!semver.valid(version)) {
      throw new Error(`Invalid Puppeteer release version: ${version}`);
    }
    return {ref: requestedRef, version};
  }

  const tags = await getReleaseTags();
  const [latest] = tags;
  if (!latest) {
    throw new Error(
      'No Puppeteer release tag found. Fetch tags or set DOCS_RELEASE_REF.',
    );
  }
  const ref = `puppeteer-v${latest}`;
  await ensureRef(ref);
  return {ref, version: latest};
}

async function getReleaseTags(): Promise<string[]> {
  const localTags = await git(['tag', '--list', 'puppeteer-v*']);
  let remoteTags = '';
  try {
    remoteTags = await git([
      'ls-remote',
      '--tags',
      '--refs',
      'origin',
      'refs/tags/puppeteer-v*',
    ]);
  } catch {
    if (!localTags) {
      throw new Error('Unable to list local or remote Puppeteer release tags.');
    }
  }
  return [...localTags.split('\n'), ...remoteTags.split('\n')]
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
    .filter(version => {
      return semver.valid(version);
    })
    .filter((version, index, versions) => {
      return versions.indexOf(version) === index;
    })
    .sort(semver.rcompare);
}

async function exportRelease(ref: string): Promise<void> {
  const archivePath = path.join(generatedDir, 'release.tar');
  await git([
    'archive',
    '--format=tar',
    `--output=${archivePath}`,
    ref,
    'docs',
    puppeteerChangelogPath,
    puppeteerCoreChangelogPath,
    'versions.json',
  ]);
  await execFile('tar', ['-xf', archivePath, '-C', releaseSourceDir]);
  await rm(archivePath);
}

async function writeCombinedChangelog(
  target: string,
  sourceDir: string,
): Promise<void> {
  const [puppeteerChangelog, puppeteerCoreChangelog] = await Promise.all([
    readFile(path.join(sourceDir, puppeteerChangelogPath), 'utf-8'),
    readFile(path.join(sourceDir, puppeteerCoreChangelogPath), 'utf-8'),
  ]);
  const changelog = mergeChangelogs(
    puppeteerChangelog,
    puppeteerCoreChangelog,
  ).replaceAll('{', '\\{');
  await writeFile(path.join(target, 'CHANGELOG.md'), changelog);
}

function getApiUrl(version: string): string {
  if (semver.gte(version, '19.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/puppeteer-${version}/docs/api/index.md`;
  }
  if (semver.gte(version, '15.3.0')) {
    return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api/index.md`;
  }
  return `https://github.com/puppeteer/puppeteer/blob/${version}/docs/api.md`;
}

async function updateSupportedBrowsers(releaseVersion: string): Promise<void> {
  const versionData = JSON.parse(
    await readFile(path.join(releaseSourceDir, 'versions.json'), 'utf-8'),
  ) as VersionData;
  const rows = [
    '| Puppeteer | Chrome | Firefox |',
    '| --------- | ------ | ------- |',
  ];

  for (const [storedVersion, browserVersions] of versionData.versions) {
    const version =
      storedVersion === 'NEXT' ? `v${releaseVersion}` : storedVersion;
    const puppeteer = `[Puppeteer ${version}](${getApiUrl(version)})`;
    const firefox = semver.gte(version, '23.0.0')
      ? `[Firefox](https://www.mozilla.org/en-US/firefox/) ${browserVersions.firefox.split('_').at(-1)}`
      : semver.gte(version, '2.1.0')
        ? 'Firefox Nightly (at the time)'
        : 'Firefox not supported';
    const chrome = semver.gte(version, '20.0.0')
      ? `[Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) ${browserVersions.chrome}`
      : `Chromium ${browserVersions.chrome}`;
    rows.push(`| ${puppeteer} | ${chrome} | ${firefox} |`);
  }

  const filename = path.join(releaseDocsDir, 'supported-browsers.md');
  const content = await readFile(filename, 'utf-8');
  const updated = content.replace(
    /(?<=<!-- version-start -->\n)[\s\S]*?(?=\n<!-- version-end -->)/,
    `\n${rows.join('\n')}\n`,
  );
  await writeFile(filename, updated);
}

async function runDocusaurusVersioning(version: string): Promise<void> {
  const docusaurus = path.join(
    websiteDir,
    'node_modules',
    '.bin',
    'docusaurus',
  );
  await execFile(docusaurus, ['docs:version', version], {
    cwd: websiteDir,
    env: {...process.env, DOCS_PATH: releaseDocsDir},
    maxBuffer: 10 * 1024 * 1024,
  });
}

async function main(): Promise<void> {
  const release = await getRelease();
  const tags = await getReleaseTags();
  const archivedVersions = tags.filter(version => {
    return version !== release.version && semver.gte(version, '15.3.0');
  });

  await Promise.all([
    rm(generatedDir, {force: true, recursive: true}),
    rm(path.join(websiteDir, 'versioned_docs'), {
      force: true,
      recursive: true,
    }),
    rm(path.join(websiteDir, 'versioned_sidebars'), {
      force: true,
      recursive: true,
    }),
    rm(path.join(websiteDir, 'versions.json'), {force: true}),
    rm(path.join(websiteDir, 'versionsArchived.json'), {force: true}),
  ]);
  await Promise.all([
    mkdir(nextDocsDir, {recursive: true}),
    mkdir(releaseSourceDir, {recursive: true}),
  ]);
  await cp(path.join(repoDir, 'docs'), nextDocsDir, {recursive: true});
  await Promise.all([
    writeCombinedChangelog(nextDocsDir, repoDir),
    exportRelease(release.ref),
    writeFile(
      path.join(websiteDir, 'versionsArchived.json'),
      JSON.stringify(archivedVersions, null, 2) + '\n',
    ),
  ]);
  await writeCombinedChangelog(releaseDocsDir, releaseSourceDir);
  await updateSupportedBrowsers(release.version);
  await runDocusaurusVersioning(release.version);
  console.log(
    `Materialized next and Puppeteer ${release.version} documentation.`,
  );
}

await main();
