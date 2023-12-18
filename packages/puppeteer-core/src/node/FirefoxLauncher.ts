/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import {rename, unlink, mkdtemp} from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  Browser as SupportedBrowsers,
  createProfile,
  Cache,
  detectBrowserPlatform,
  Browser,
} from '@puppeteer/browsers';

import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';

import type {
  BrowserLaunchArgumentOptions,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {ProductLauncher, type ResolvedLaunchArgs} from './ProductLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';
import {rm} from './util/fs.js';

/**
 * @internal
 */
export class FirefoxLauncher extends ProductLauncher {
  constructor(puppeteer: PuppeteerNode) {
    super(puppeteer, 'firefox');
  }

  static getPreferences(
    extraPrefsFirefox?: Record<string, unknown>,
    protocol?: 'cdp' | 'webDriverBiDi'
  ): Record<string, unknown> {
    return {
      ...extraPrefsFirefox,
      ...(protocol === 'webDriverBiDi'
        ? {}
        : {
            // Temporarily force disable BFCache in parent (https://bit.ly/bug-1732263)
            'fission.bfcacheInParent': false,
          }),
      // Force all web content to use a single content process. TODO: remove
      // this once Firefox supports mouse event dispatch from the main frame
      // context. Once this happens, webContentIsolationStrategy should only
      // be set for CDP. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1773393
      'fission.webContentIsolationStrategy': 0,
    };
  }

  /**
   * @internal
   */
  override async computeLaunchArguments(
    options: PuppeteerNodeLaunchOptions = {}
  ): Promise<ResolvedLaunchArgs> {
    const {
      ignoreDefaultArgs = false,
      args = [],
      executablePath,
      pipe = false,
      extraPrefsFirefox = {},
      debuggingPort = null,
    } = options;

    const firefoxArguments = [];
    if (!ignoreDefaultArgs) {
      firefoxArguments.push(...this.defaultArgs(options));
    } else if (Array.isArray(ignoreDefaultArgs)) {
      firefoxArguments.push(
        ...this.defaultArgs(options).filter(arg => {
          return !ignoreDefaultArgs.includes(arg);
        })
      );
    } else {
      firefoxArguments.push(...args);
    }

    if (
      !firefoxArguments.some(argument => {
        return argument.startsWith('--remote-debugging-');
      })
    ) {
      if (pipe) {
        assert(
          debuggingPort === null,
          'Browser should be launched with either pipe or debugging port - not both.'
        );
      }
      firefoxArguments.push(`--remote-debugging-port=${debuggingPort || 0}`);
    }

    let userDataDir: string | undefined;
    let isTempUserDataDir = true;

    // Check for the profile argument, which will always be set even
    // with a custom directory specified via the userDataDir option.
    const profileArgIndex = firefoxArguments.findIndex(arg => {
      return ['-profile', '--profile'].includes(arg);
    });

    if (profileArgIndex !== -1) {
      userDataDir = firefoxArguments[profileArgIndex + 1];
      if (!userDataDir || !fs.existsSync(userDataDir)) {
        throw new Error(`Firefox profile not found at '${userDataDir}'`);
      }

      // When using a custom Firefox profile it needs to be populated
      // with required preferences.
      isTempUserDataDir = false;
    } else {
      userDataDir = await mkdtemp(this.getProfilePath());
      firefoxArguments.push('--profile');
      firefoxArguments.push(userDataDir);
    }

    await createProfile(SupportedBrowsers.FIREFOX, {
      path: userDataDir,
      preferences: FirefoxLauncher.getPreferences(
        extraPrefsFirefox,
        options.protocol
      ),
    });

    let firefoxExecutable: string;
    if (this.puppeteer._isPuppeteerCore || executablePath) {
      assert(
        executablePath,
        `An \`executablePath\` must be specified for \`puppeteer-core\``
      );
      firefoxExecutable = executablePath;
    } else {
      firefoxExecutable = this.executablePath();
    }

    return {
      isTempUserDataDir,
      userDataDir,
      args: firefoxArguments,
      executablePath: firefoxExecutable,
    };
  }

  /**
   * @internal
   */
  override async cleanUserDataDir(
    userDataDir: string,
    opts: {isTemp: boolean}
  ): Promise<void> {
    if (opts.isTemp) {
      try {
        await rm(userDataDir);
      } catch (error) {
        debugError(error);
        throw error;
      }
    } else {
      try {
        // When an existing user profile has been used remove the user
        // preferences file and restore possibly backuped preferences.
        await unlink(path.join(userDataDir, 'user.js'));

        const prefsBackupPath = path.join(userDataDir, 'prefs.js.puppeteer');
        if (fs.existsSync(prefsBackupPath)) {
          const prefsPath = path.join(userDataDir, 'prefs.js');
          await unlink(prefsPath);
          await rename(prefsBackupPath, prefsPath);
        }
      } catch (error) {
        debugError(error);
      }
    }
  }

  override executablePath(): string {
    // replace 'latest' placeholder with actual downloaded revision
    if (this.puppeteer.browserRevision === 'latest') {
      const cache = new Cache(this.puppeteer.defaultDownloadPath!);
      const installedFirefox = cache.getInstalledBrowsers().find(browser => {
        return (
          browser.platform === detectBrowserPlatform() &&
          browser.browser === Browser.FIREFOX
        );
      });
      if (installedFirefox) {
        this.actualBrowserRevision = installedFirefox.buildId;
      }
    }
    return this.resolveExecutablePath();
  }

  override defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;

    const firefoxArguments = ['--no-remote'];

    switch (os.platform()) {
      case 'darwin':
        firefoxArguments.push('--foreground');
        break;
      case 'win32':
        firefoxArguments.push('--wait-for-browser');
        break;
    }
    if (userDataDir) {
      firefoxArguments.push('--profile');
      firefoxArguments.push(userDataDir);
    }
    if (headless) {
      firefoxArguments.push('--headless');
    }
    if (devtools) {
      firefoxArguments.push('--devtools');
    }
    if (
      args.every(arg => {
        return arg.startsWith('-');
      })
    ) {
      firefoxArguments.push('about:blank');
    }
    firefoxArguments.push(...args);
    return firefoxArguments;
  }
}
