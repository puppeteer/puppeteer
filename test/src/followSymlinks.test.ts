/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import expect from 'expect';
import puppeteer from 'puppeteer/internal/puppeteer.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('followSymlinks', () => {
  let tmpDir: string;
  let scriptFile: string;
  let scriptSymlink: string;
  let styleFile: string;
  let styleSymlink: string;
  let symlinksSupported = true;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'pptr-symlink-'));
    scriptFile = path.join(tmpDir, 'script.js');
    scriptSymlink = path.join(tmpDir, 'script-link.js');
    await fs.promises.writeFile(scriptFile, 'window.__injected = 123;');
    try {
      await fs.promises.symlink(scriptFile, scriptSymlink);
      symlinksSupported = true;
    } catch {
      symlinksSupported = false;
      return;
    }

    styleFile = path.join(tmpDir, 'style.css');
    styleSymlink = path.join(tmpDir, 'style-link.css');
    await fs.promises.writeFile(
      styleFile,
      'body { background-color: rgb(0, 255, 0); }',
    );
    await fs.promises.symlink(styleFile, styleSymlink);
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, {recursive: true, force: true});
  });

  describe('when followSymlinks is false', () => {
    setupTestBrowserHooks();

    beforeEach(() => {
      puppeteer.setFollowSymlinks(false);
    });

    afterEach(() => {
      puppeteer.setFollowSymlinks(true);
    });

    it('should reject addScriptTag with a symlinked path', async function () {
      if (!symlinksSupported || process.platform === 'win32') {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      let error!: Error;
      try {
        await page.addScriptTag({path: scriptSymlink});
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ELOOP');
    });

    it('should allow addScriptTag with a regular file path', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      await page.addScriptTag({path: scriptFile});
      const result = await page.evaluate(() => {
        return (globalThis as unknown as {__injected?: number}).__injected;
      });
      expect(result).toBe(123);
    });

    it('should reject addStyleTag with a symlinked path', async function () {
      if (!symlinksSupported || process.platform === 'win32') {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      let error!: Error;
      try {
        await page.addStyleTag({path: styleSymlink});
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ELOOP');
    });

    it('should allow addStyleTag with a regular file path', async () => {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      await page.addStyleTag({path: styleFile});
      const result = await page.evaluate(() => {
        return window
          .getComputedStyle(document.body)
          .getPropertyValue('background-color');
      });
      expect(result).toBe('rgb(0, 255, 0)');
    });

    it('should reject screenshot to an existing symlink path', async function () {
      if (!symlinksSupported || process.platform === 'win32') {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const targetFile = path.join(tmpDir, 'screenshot.png');
      const linkFile = path.join(tmpDir, 'screenshot-link.png');
      await fs.promises.writeFile(targetFile, 'placeholder');
      await fs.promises.symlink(targetFile, linkFile);

      let error!: Error;
      try {
        await page.screenshot({path: linkFile});
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ELOOP');
    });

    it('should reject pdf to an existing symlink path', async function () {
      if (!symlinksSupported || process.platform === 'win32') {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const targetFile = path.join(tmpDir, 'output.pdf');
      const linkFile = path.join(tmpDir, 'output-link.pdf');
      await fs.promises.writeFile(targetFile, 'placeholder');
      await fs.promises.symlink(targetFile, linkFile);

      let error!: Error;
      try {
        await page.pdf({path: linkFile});
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ELOOP');
    });

    it('should reject screencast to an existing symlink path', async function () {
      if (!symlinksSupported || process.platform === 'win32') {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const targetFile = path.join(tmpDir, 'output.webm');
      const linkFile = path.join(tmpDir, 'output-link.webm');
      await fs.promises.writeFile(targetFile, 'placeholder');
      await fs.promises.symlink(targetFile, linkFile);

      let error!: Error;
      try {
        await page.screencast({path: linkFile as `${string}.webm`});
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('ELOOP');
    });

    it('should reject screencast when overwrite is false and file exists', async function () {
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const targetFile = path.join(tmpDir, 'output.webm');
      await fs.promises.writeFile(targetFile, 'placeholder');

      let error!: Error;
      try {
        await page.screencast({
          path: targetFile as `${string}.webm`,
          overwrite: false,
        });
      } catch (err) {
        error = err as Error;
      }
      expect(error).toBeDefined();
      expect((error as NodeJS.ErrnoException).code).toBe('EEXIST');
    });
  });

  describe('when followSymlinks is true (default)', () => {
    setupTestBrowserHooks();

    it('should allow addScriptTag with a symlinked path', async function () {
      if (!symlinksSupported) {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      await page.addScriptTag({path: scriptSymlink});
      const result = await page.evaluate(() => {
        return (globalThis as unknown as {__injected?: number}).__injected;
      });
      expect(result).toBe(123);
    });

    it('should allow addStyleTag with a symlinked path', async function () {
      if (!symlinksSupported) {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      await page.addStyleTag({path: styleSymlink});
      const result = await page.evaluate(() => {
        return window
          .getComputedStyle(document.body)
          .getPropertyValue('background-color');
      });
      expect(result).toBe('rgb(0, 255, 0)');
    });

    it('should allow screenshot to a symlink path', async function () {
      if (!symlinksSupported) {
        this.skip();
      }
      const {page, server} = await getTestState();
      await page.goto(server.EMPTY_PAGE);

      const targetFile = path.join(tmpDir, 'screenshot-target.png');
      const linkFile = path.join(tmpDir, 'screenshot-default-link.png');
      await fs.promises.writeFile(targetFile, 'placeholder');
      await fs.promises.symlink(targetFile, linkFile);

      await page.screenshot({path: linkFile});
      const content = await fs.promises.readFile(targetFile);
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
