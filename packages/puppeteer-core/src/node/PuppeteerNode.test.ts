/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it, beforeEach, afterEach} from 'node:test';

import expect from 'expect';

import {PuppeteerNode} from './PuppeteerNode.js';

describe('PuppeteerNode', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(join(tmpdir(), 'puppeteer-unit-test-'));
  });

  afterEach(() => {
    fs.rmdirSync(tmpDir);
  });

  describe('executablePath()', () => {
    it('returns the default path', () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: {
          cacheDirectory: tmpDir,
        },
      });
      expect(puppeteer.executablePath()).toContain('chrome');
    });

    it('returns the default path based on the default browser configuration', () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: {
          cacheDirectory: tmpDir,
          defaultBrowser: 'firefox',
        },
      });
      expect(puppeteer.executablePath().toLowerCase()).toContain('firefox');
    });

    it('returns the default path for a given Chrome channel', () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: {
          cacheDirectory: tmpDir,
        },
      });
      expect(puppeteer.executablePath('chrome').toLowerCase()).toContain(
        'chrome',
      );
    });

    it('returns the default path for chrome-headless-shell', () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: {
          cacheDirectory: tmpDir,
        },
      });
      expect(
        puppeteer
          .executablePath({
            headless: 'shell',
          })
          .toLowerCase(),
      ).toContain('chrome-headless-shell');
    });
  });

  describe('defaultArgs()', () => {
    it('returns the default args without arguments', () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: {
          cacheDirectory: tmpDir,
        },
      });
      expect(puppeteer.defaultArgs()).toBeInstanceOf(Array);
    });
  });
});
