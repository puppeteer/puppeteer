/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, it} from 'node:test';

import expect from 'expect';

import {
  type BrowserVersions,
  deduplicateBrowserVersions,
  generateSupportedBrowsersTable,
  getLastMaintainedVersion,
} from './generate-supported-browsers.ts';

void describe('generate-supported-browsers', () => {
  void describe('deduplicateBrowserVersions', () => {
    void it('returns empty array when input is empty', () => {
      expect(deduplicateBrowserVersions([])).toEqual([]);
    });

    void it('returns single entry when input has 1 entry', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
      ];
      expect(deduplicateBrowserVersions(versions)).toEqual(versions);
    });

    void it('deduplicates consecutive releases with identical browser pins', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.9.0', {chrome: '152.0.7977.54', firefox: 'stable_154.0'}],
        ['v25.8.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.7.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.6.0', {chrome: '151.0.7922.77', firefox: 'stable_153.0.3'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v25.9.0', {chrome: '152.0.7977.54', firefox: 'stable_154.0'}],
        ['v25.7.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.6.0', {chrome: '151.0.7922.77', firefox: 'stable_153.0.3'}],
      ]);
    });

    void it('always includes the latest release even if its pins match the prior release', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.8.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.7.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.6.0', {chrome: '151.0.7922.77', firefox: 'stable_153.0.3'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v25.8.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
        ['v25.6.0', {chrome: '151.0.7922.77', firefox: 'stable_153.0.3'}],
      ]);
    });

    void it('deduplicates multiple consecutive releases with same pins', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.1.0', {chrome: '149.0.7827.22', firefox: 'stable_151.0'}],
        ['v25.0.4', {chrome: '148.0.7778.167', firefox: 'stable_150.0.3'}],
        ['v25.0.3', {chrome: '148.0.7778.167', firefox: 'stable_150.0.3'}],
        ['v25.0.2', {chrome: '148.0.7778.167', firefox: 'stable_150.0.3'}],
        ['v25.0.1', {chrome: '148.0.7778.167', firefox: 'stable_150.0.3'}],
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v25.1.0', {chrome: '149.0.7827.22', firefox: 'stable_151.0'}],
        ['v25.0.1', {chrome: '148.0.7778.167', firefox: 'stable_150.0.3'}],
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
      ]);
    });

    void it('smoothly transitions across pre-v25 boundary when pins match', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.1.0', {chrome: '149.0.7827.22', firefox: 'stable_151.0'}],
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v25.1.0', {chrome: '149.0.7827.22', firefox: 'stable_151.0'}],
        ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ]);
    });

    void it('smoothly transitions across pre-v25 boundary when v25.0.0 is the latest release', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v25.0.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ]);
    });

    void it('retains entry when only Chrome changes', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v24.42.0', {chrome: '147.0.7727.57', firefox: 'stable_149.0.2'}],
        ['v24.41.0', {chrome: '147.0.7727.56', firefox: 'stable_149.0.2'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v24.42.0', {chrome: '147.0.7727.57', firefox: 'stable_149.0.2'}],
        ['v24.41.0', {chrome: '147.0.7727.56', firefox: 'stable_149.0.2'}],
      ]);
    });

    void it('retains entry when only Firefox changes', () => {
      const versions: Array<[string, BrowserVersions]> = [
        ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ];

      const deduplicated = deduplicateBrowserVersions(versions);
      expect(deduplicated).toEqual([
        ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ['v24.43.0', {chrome: '148.0.7778.97', firefox: 'stable_150.0.1'}],
      ]);
    });
  });

  void describe('getLastMaintainedVersion', () => {
    void it('finds the last maintained version correctly with deduplicated data', () => {
      const versionData = {
        versions: [
          ['v25.9.0', {chrome: '152.0.7977.54', firefox: 'stable_154.0'}],
          ['v25.7.0', {chrome: '152.0.7977.42', firefox: 'stable_153.0.4'}],
          ['v25.6.0', {chrome: '151.0.7922.77', firefox: 'stable_153.0.3'}],
          ['v25.3.0', {chrome: '150.0.7871.24', firefox: 'stable_152.0.4'}],
          ['v25.1.0', {chrome: '149.0.7827.22', firefox: 'stable_151.0'}],
          ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
        ] as Array<[string, BrowserVersions]>,
      };

      const result = getLastMaintainedVersion(versionData);
      expect(result).toEqual([
        'v25.1.0',
        {chrome: '149.0.7827.22', firefox: 'stable_151.0'},
      ]);
    });

    void it('returns undefined for empty versions', () => {
      expect(getLastMaintainedVersion({versions: []})).toBeUndefined();
    });
  });

  void describe('generateSupportedBrowsersTable', () => {
    void it('generates table with markdown links', () => {
      const versionData = {
        versions: [
          ['v25.9.0', {chrome: '152.0.7977.54', firefox: 'stable_154.0'}],
          ['v24.43.1', {chrome: '148.0.7778.97', firefox: 'stable_150.0.2'}],
          ['v22.15.0', {chrome: '127.0.6533.88', firefox: 'latest'}],
          ['v1.20.0', {chrome: '78.0.3882.0', firefox: 'latest'}],
        ] as Array<[string, BrowserVersions]>,
      };

      const table = generateSupportedBrowsersTable(versionData);
      expect(table).toContain(
        '| [Puppeteer v25.9.0](https://github.com/puppeteer/puppeteer/blob/puppeteer-v25.9.0/docs/api/index.md) | [Chrome for Testing](https://developer.chrome.com/blog/chrome-for-testing/) 152.0.7977.54 | [Firefox](https://www.mozilla.org/en-US/firefox/) 154.0 |',
      );
      expect(table).toContain('Firefox Nightly (at the time)');
      expect(table).toContain('Firefox not supported');
    });
  });
});
