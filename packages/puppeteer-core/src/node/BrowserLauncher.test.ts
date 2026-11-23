/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, it} from 'node:test';

import expect from 'expect';

import type {Browser} from '../api/Browser.js';
import type {Connection} from '../cdp/Connection.js';
import {UnsupportedOperation} from '../common/Errors.js';
import type {SupportedBrowser} from '../common/SupportedBrowser.js';
import {Deferred} from '../util/Deferred.js';

import {
  BrowserLauncher,
  registerProcessExitCleanup,
  type ResolvedLaunchArgs,
} from './BrowserLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';

class ProcessEmitter {
  #listeners = new Set<() => void>();

  get listenerCount(): number {
    return this.#listeners.size;
  }

  once(_event: 'exit', listener: () => void): void {
    this.#listeners.add(listener);
  }

  off(_event: 'exit', listener: () => void): void {
    this.#listeners.delete(listener);
  }

  emit(_event: 'exit'): void {
    for (const listener of this.#listeners) {
      listener();
    }
    this.#listeners.clear();
  }
}

const logger = (_prefix: string) => {
  return undefined;
};

describe('registerProcessExitCleanup', () => {
  it('removes a temporary profile synchronously on process exit', () => {
    const userDataDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    writeFileSync(join(userDataDir, 'profile'), 'profile');
    const processEmitter = new ProcessEmitter();

    registerProcessExitCleanup(userDataDir, logger, processEmitter);
    processEmitter.emit('exit');

    expect(existsSync(userDataDir)).toBe(false);
  });

  it('can unregister cleanup after the browser process exits', () => {
    const userDataDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    const processEmitter = new ProcessEmitter();
    const unregister = registerProcessExitCleanup(
      userDataDir,
      logger,
      processEmitter,
    );

    unregister();
    processEmitter.emit('exit');

    expect(existsSync(userDataDir)).toBe(true);
    rmSync(userDataDir, {recursive: true, force: true});
  });

  it('uses one process-exit listener for multiple temporary profiles', () => {
    const firstDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    const secondDir = mkdtempSync(
      join(tmpdir(), 'puppeteer-process-exit-cleanup-'),
    );
    const processEmitter = new ProcessEmitter();

    registerProcessExitCleanup(firstDir, logger, processEmitter);
    registerProcessExitCleanup(secondDir, logger, processEmitter);
    expect(processEmitter.listenerCount).toBe(1);

    processEmitter.emit('exit');

    expect(existsSync(firstDir)).toBe(false);
    expect(existsSync(secondDir)).toBe(false);
  });
});

// @ts-expect-error abstract methods not needed for launch option validation test
class TestBrowserLauncher extends BrowserLauncher {
  computeLaunchArgumentsCalled = false;

  constructor(browser: SupportedBrowser) {
    super({} as PuppeteerNode, browser, logger);
  }

  override async computeLaunchArguments(): Promise<never> {
    this.computeLaunchArgumentsCalled = true;
    throw new Error('should not compute launch arguments');
  }
}

class ExtensionInstallTestBrowserLauncher extends BrowserLauncher {
  #browser: Browser;

  constructor(browser: Browser) {
    super(
      {
        configuration: () => {
          return Promise.resolve({});
        },
      } as unknown as PuppeteerNode,
      'chrome',
      logger,
    );
    this.#browser = browser;
  }

  override async executablePath(): Promise<string> {
    return process.execPath;
  }

  override defaultArgs(): string[] {
    return [];
  }

  protected override async computeLaunchArguments(): Promise<ResolvedLaunchArgs> {
    return {
      isTempUserDataDir: false,
      userDataDir: '',
      executablePath: process.execPath,
      args: ['-e', ''],
    };
  }

  protected override async cleanUserDataDir(): Promise<void> {}

  protected override async createCdpSocketConnection(): Promise<Connection> {
    return {
      closeBrowser: async () => {},
    } as unknown as Connection;
  }

  protected override async createBiDiOverCdpBrowser(): Promise<Browser> {
    return this.#browser;
  }
}

describe('BrowserLauncher.launch', () => {
  it('rejects targetFilter for Chrome with WebDriver BiDi before launching', async () => {
    const launcher = new TestBrowserLauncher('chrome');

    await expect(
      launcher.launch({
        protocol: 'webDriverBiDi',
        targetFilter: () => {
          return true;
        },
      }),
    ).rejects.toThrow(UnsupportedOperation);
    expect(launcher.computeLaunchArgumentsCalled).toBe(false);
  });

  it('rejects targetFilter for Firefox defaulting to WebDriver BiDi before launching', async () => {
    const launcher = new TestBrowserLauncher('firefox');

    await expect(
      launcher.launch({
        targetFilter: () => {
          return true;
        },
      }),
    ).rejects.toThrow(UnsupportedOperation);
    expect(launcher.computeLaunchArgumentsCalled).toBe(false);
  });

  it('awaits enableExtensions installation before resolving', async () => {
    const firstInstall = Deferred.create<string>();
    const secondInstall = Deferred.create<string>();
    const calls: Array<{
      path: string;
      options: {enabledInIncognito?: boolean} | undefined;
    }> = [];
    let settled = false;

    const browser = {
      installExtension: (
        extensionPath: string,
        options?: {enabledInIncognito?: boolean},
      ) => {
        calls.push({path: extensionPath, options});
        if (extensionPath === '/ext/one') {
          return firstInstall.valueOrThrow();
        }
        return secondInstall.valueOrThrow();
      },
      close: async () => {},
    } as unknown as Browser;

    const launcher = new ExtensionInstallTestBrowserLauncher(browser);
    const launchPromise = launcher
      .launch({
        protocol: 'webDriverBiDi',
        waitForInitialPage: false,
        enableExtensions: ['/ext/one', '/ext/two'],
        extensionsEnabledInIncognito: ['/ext/two'],
      })
      .finally(() => {
        settled = true;
      });

    await new Promise(resolve => {
      return setTimeout(resolve, 20);
    });
    expect(calls).toEqual([
      {path: '/ext/one', options: {enabledInIncognito: false}},
      {path: '/ext/two', options: {enabledInIncognito: true}},
    ]);
    expect(settled).toBe(false);

    firstInstall.resolve('id-one');
    await new Promise(resolve => {
      return setTimeout(resolve, 20);
    });
    expect(settled).toBe(false);

    secondInstall.resolve('id-two');
    await expect(launchPromise).resolves.toBe(browser);
    await browser.close();
  });

  it('closes the browser and rejects if installing enableExtensions fails', async () => {
    let closed = false;
    const browser = {
      installExtension: async () => {
        throw new Error('install failed');
      },
      close: async () => {
        closed = true;
      },
    } as unknown as Browser;

    const launcher = new ExtensionInstallTestBrowserLauncher(browser);

    await expect(
      launcher.launch({
        protocol: 'webDriverBiDi',
        waitForInitialPage: false,
        enableExtensions: ['/ext/bad'],
      }),
    ).rejects.toThrow('install failed');
    expect(closed).toBe(true);
  });
});
