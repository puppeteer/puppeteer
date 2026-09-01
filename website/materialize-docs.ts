/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {execFile as execFileCallback} from 'node:child_process';
import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';

import semver from 'semver';

import {
  type BrowserVersionData,
  ensureRef,
  generateSupportedBrowsersTable,
  getReleaseTags,
  getSupportedBrowserData,
  git,
} from '../tools/generate-supported-browsers.ts';
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

interface Release {
  ref: string;
  version: string;
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

async function updateSupportedBrowsers(
  targetDocsDir: string,
  versionData: BrowserVersionData,
  releaseVersion?: string,
): Promise<void> {
  const filename = path.join(targetDocsDir, 'supported-browsers.md');
  const content = await readFile(filename, 'utf-8');
  const table = generateSupportedBrowsersTable(versionData, releaseVersion);
  const updated = content.replace(
    /(?:\{?\/\*?|<!--)\s*version-list\s*(?:\*\/\}?|-->)/,
    table,
  );
  await writeFile(filename, updated);
}

async function sanitizeMdxComments(dir: string): Promise<void> {
  const entries = await readdir(dir, {withFileTypes: true, recursive: true});
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const fullPath = path.join(entry.parentPath ?? dir, entry.name);
      const content = await readFile(fullPath, 'utf-8');
      if (content.includes('<!--')) {
        const sanitized = content.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');
        await writeFile(fullPath, sanitized);
      }
    }
  }
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
  await cp(
    path.join(repoDir, 'docs', 'supported-browsers.md'),
    path.join(releaseDocsDir, 'supported-browsers.md'),
  );
  const versionData = await getSupportedBrowserData({
    release,
    tags,
    repoDir,
    websiteDir,
  });
  await sanitizeMdxComments(releaseDocsDir);
  await sanitizeMdxComments(nextDocsDir);
  await writeCombinedChangelog(releaseDocsDir, releaseSourceDir);
  await updateSupportedBrowsers(nextDocsDir, versionData);
  await updateSupportedBrowsers(releaseDocsDir, versionData, release.version);
  await runDocusaurusVersioning(release.version);
  console.log(
    `Materialized next and Puppeteer ${release.version} documentation.`,
  );
}

await main();
