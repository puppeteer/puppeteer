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
    it('returns the default path', async () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: () => {
          return Promise.resolve({
            cacheDirectory: tmpDir,
          });
        },
      });
      expect(await puppeteer.executablePath()).toContain('chrome');
    });

    it('returns the default path based on the default browser configuration', async () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: () => {
          return Promise.resolve({
            cacheDirectory: tmpDir,
            defaultBrowser: 'firefox',
          });
        },
      });
      expect((await puppeteer.executablePath()).toLowerCase()).toContain(
        'firefox',
      );
    });

    it('returns the default path for a given Chrome channel', async () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: () => {
          return Promise.resolve({
            cacheDirectory: tmpDir,
          });
        },
      });
      expect(
        (await puppeteer.executablePath('chrome')).toLowerCase(),
      ).toContain('chrome');
    });

    it('returns the default path for chrome-headless-shell', async () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: () => {
          return Promise.resolve({
            cacheDirectory: tmpDir,
          });
        },
      });
      expect(
        (
          await puppeteer.executablePath({
            headless: 'shell',
          })
        ).toLowerCase(),
      ).toContain('chrome-headless-shell');
    });
  });

  describe('defaultArgs()', () => {
    it('returns the default args without arguments', async () => {
      const puppeteer = new PuppeteerNode({
        isPuppeteerCore: false,
        configuration: () => {
          return Promise.resolve({
            cacheDirectory: tmpDir,
          });
        },
      });
      const args = await puppeteer.defaultArgs();
      expect(args).toBeInstanceOf(Array);
    });
  });
});
