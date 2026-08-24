/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This script merges puppeteer and puppeteer-core changelogs into a single
 * changelog file.
 */

import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

interface Version {
  version: string;
  header: string;
  lines: string[];
}

function parseChangelog(content: string) {
  const log = content.split('\n');

  const parsed: Version[] = [];
  let version: Version | undefined = undefined;
  for (const line of log) {
    if (line.startsWith('## ')) {
      if (version) {
        parsed.push(version);
      }
      const matches = line.match(/## \[(\d+\.\d+\.\d+)\]/);
      if (!matches) {
        throw new Error('Cannot parse the version');
      }
      version = {
        version: matches[1],
        lines: [],
        header: line,
      };
    } else if (version && line.trim() !== '') {
      version.lines.push(line);
    }
  }
  if (version) {
    parsed.push(version);
  }
  return parsed;
}

function mergeVersions(a: Version, b: Version): Version {
  const result: Version = {
    version: a.version,
    header: a.header,
    lines: [],
  };
  const sectionEntries = new Map<string, Set<string>>();

  function walkLines(lines: string[]) {
    let currentSection: string | undefined = undefined;
    for (const lineA of lines) {
      if (lineA.trim() === '') {
        continue;
      }
      if (lineA.startsWith('### ')) {
        if (lineA !== currentSection) {
          sectionEntries.set(lineA, new Set());
        }
        currentSection = lineA;
      } else if (currentSection) {
        sectionEntries.get(currentSection)!.add(lineA);
      }
    }
  }

  walkLines(a.lines);
  walkLines(b.lines);

  for (const [section, lines] of sectionEntries) {
    result.lines.push('\n\n' + section + '\n');
    result.lines.push(...lines);
  }

  result.lines[result.lines.length - 1] += '\n\n';

  return result;
}

export function mergeChangelogs(
  puppeteerChangelogContent: string,
  puppeteerCoreChangelogContent: string,
): string {
  const puppeteerChangelog = parseChangelog(puppeteerChangelogContent);
  const puppeteerCoreChangelog = parseChangelog(puppeteerCoreChangelogContent);

  const combinedChangelog: string[] = [
    '# Changelog',
    '',
    'Combined changelog for puppeteer and puppeteer-core.',
    '',
  ];

  for (let entry of puppeteerChangelog) {
    for (const coreEntry of puppeteerCoreChangelog) {
      if (coreEntry.version === entry.version) {
        entry = mergeVersions(entry, coreEntry);
      }
    }
    combinedChangelog.push(entry.header);
    combinedChangelog.push(...entry.lines);
  }

  return combinedChangelog.join('\n');
}

if (import.meta.main) {
  const puppeteerChangelog = readFileSync(
    './packages/puppeteer/CHANGELOG.md',
    'utf-8',
  );
  const puppeteerCoreChangelog = readFileSync(
    './packages/puppeteer-core/CHANGELOG.md',
    'utf-8',
  );
  writeFileSync(
    './CHANGELOG.md',
    mergeChangelogs(puppeteerChangelog, puppeteerCoreChangelog),
  );
}
