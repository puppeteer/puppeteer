/**
 * Copyright 2023 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {mkdtemp} from 'fs/promises';
import os from 'os';
import path from 'path';

import {
  computeSystemExecutablePath,
  Browser as SupportedBrowsers,
  ChromeReleaseChannel as BrowsersChromeReleaseChannel,
} from '@puppeteer/browsers';

import type {Browser} from '../api/Browser.js';
import {debugError} from '../common/util.js';
import {assert} from '../util/assert.js';

import type {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {ProductLauncher, type ResolvedLaunchArgs} from './ProductLauncher.js';
import type {PuppeteerNode} from './PuppeteerNode.js';
import {rm} from './util/fs.js';

/**
 * @internal
 */
export class ChromeLauncher extends ProductLauncher {
  constructor(puppeteer: PuppeteerNode) {
    super(puppeteer, 'chrome');
  }

  override launch(options: PuppeteerNodeLaunchOptions = {}): Promise<Browser> {
    const headless = options.headless ?? true;
    if (
      headless === true &&
      this.puppeteer.configuration.logLevel === 'warn' &&
      !Boolean(process.env['PUPPETEER_DISABLE_HEADLESS_WARNING'])
    ) {
      console.warn(
        [
          '\x1B[1m\x1B[43m\x1B[30m',
          'Puppeteer old Headless deprecation warning:\x1B[0m\x1B[33m',
          '  In the near future `headless: true` will default to the new Headless mode',
          '  for Chrome instead of the old Headless implementation. For more',
          '  information, please see https://developer.chrome.com/articles/new-headless/.',
          '  Consider opting in early by passing `headless: "new"` to `puppeteer.launch()`',
          '  If you encounter any bugs, please report them to https://github.com/puppeteer/puppeteer/issues/new/choose.\x1B[0m\n',
        ].join('\n  ')
      );
    }

    if (
      this.puppeteer.configuration.logLevel === 'warn' &&
      process.platform === 'darwin' &&
      process.arch === 'x64'
    ) {
      const cpus = os.cpus();
      if (cpus[0]?.model.includes('Apple')) {
        console.warn(
          [
            '\x1B[1m\x1B[43m\x1B[30m',
            'Degraded performance warning:\x1B[0m\x1B[33m',
            'Launching Chrome on Mac Silicon (arm64) from an x64 Node installation results in',
            'Rosetta translating the Chrome binary, even if Chrome is already arm64. This would',
            'result in huge performance issues. To resolve this, you must run Puppeteer with',
            'a version of Node built for arm64.',
          ].join('\n  ')
        );
      }
    }

    return super.launch(options);
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
      pipe = false,
      debuggingPort,
      channel,
      executablePath,
    } = options;

    const chromeArguments = [];
    if (!ignoreDefaultArgs) {
      chromeArguments.push(...this.defaultArgs(options));
    } else if (Array.isArray(ignoreDefaultArgs)) {
      chromeArguments.push(
        ...this.defaultArgs(options).filter(arg => {
          return !ignoreDefaultArgs.includes(arg);
        })
      );
    } else {
      chromeArguments.push(...args);
    }

    if (
      !chromeArguments.some(argument => {
        return argument.startsWith('--remote-debugging-');
      })
    ) {
      if (pipe) {
        assert(
          !debuggingPort,
          'Browser should be launched with either pipe or debugging port - not both.'
        );
        chromeArguments.push('--remote-debugging-pipe');
      } else {
        chromeArguments.push(`--remote-debugging-port=${debuggingPort || 0}`);
      }
    }

    let isTempUserDataDir = false;

    // Check for the user data dir argument, which will always be set even
    // with a custom directory specified via the userDataDir option.
    let userDataDirIndex = chromeArguments.findIndex(arg => {
      return arg.startsWith('--user-data-dir');
    });
    if (userDataDirIndex < 0) {
      isTempUserDataDir = true;
      chromeArguments.push(
        `--user-data-dir=${await mkdtemp(this.getProfilePath())}`
      );
      userDataDirIndex = chromeArguments.length - 1;
    }

    const userDataDir = chromeArguments[userDataDirIndex]!.split('=', 2)[1];
    assert(typeof userDataDir === 'string', '`--user-data-dir` is malformed');

    let chromeExecutable = executablePath;
    if (!chromeExecutable) {
      assert(
        channel || !this.puppeteer._isPuppeteerCore,
        `An \`executablePath\` or \`channel\` must be specified for \`puppeteer-core\``
      );
      chromeExecutable = this.executablePath(channel);
    }

    return {
      executablePath: chromeExecutable,
      args: chromeArguments,
      isTempUserDataDir,
      userDataDir,
    };
  }

  /**
   * @internal
   */
  override async cleanUserDataDir(
    path: string,
    opts: {isTemp: boolean}
  ): Promise<void> {
    if (opts.isTemp) {
      try {
        await rm(path);
      } catch (error) {
        debugError(error);
        throw error;
      }
    }
  }

  override defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    // See https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md

    const userDisabledFeatures = getFeatures(
      '--disable-features',
      options.args
    );
    if (options.args && userDisabledFeatures.length > 0) {
      removeMatchingFlags(options.args, '--disable-features');
    }

    // Merge default disabled features with user-provided ones, if any.
    const disabledFeatures = [
      'Translate',
      // AcceptCHFrame disabled because of crbug.com/1348106.
      'AcceptCHFrame',
      'MediaRouter',
      'OptimizationHints',
      // https://crbug.com/1492053
      'ProcessPerSiteUpToMainFrameThreshold',
      ...userDisabledFeatures,
    ];

    const userEnabledFeatures = getFeatures('--enable-features', options.args);
    if (options.args && userEnabledFeatures.length > 0) {
      removeMatchingFlags(options.args, '--enable-features');
    }

    // Merge default enabled features with user-provided ones, if any.
    const enabledFeatures = [
      'NetworkServiceInProcess2',
      ...userEnabledFeatures,
    ];

    const chromeArguments = [
      '--allow-pre-commit-input',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-field-trial-config', // https://source.chromium.org/chromium/chromium/src/+/main:testing/variations/README.md
      '--disable-hang-monitor',
      '--disable-infobars',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-search-engine-choice-screen',
      '--disable-sync',
      '--enable-automation',
      '--export-tagged-pdf',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
      `--disable-features=${disabledFeatures.join(',')}`,
      `--enable-features=${enabledFeatures.join(',')}`,
    ];
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir,
    } = options;
    if (userDataDir) {
      chromeArguments.push(`--user-data-dir=${path.resolve(userDataDir)}`);
    }
    if (devtools) {
      chromeArguments.push('--auto-open-devtools-for-tabs');
    }
    if (headless) {
      chromeArguments.push(
        headless === 'new' ? '--headless=new' : '--headless',
        '--hide-scrollbars',
        '--mute-audio'
      );
    }
    if (
      args.every(arg => {
        return arg.startsWith('-');
      })
    ) {
      chromeArguments.push('about:blank');
    }
    chromeArguments.push(...args);
    return chromeArguments;
  }

  override executablePath(channel?: ChromeReleaseChannel): string {
    if (channel) {
      return computeSystemExecutablePath({
        browser: SupportedBrowsers.CHROME,
        channel: convertPuppeteerChannelToBrowsersChannel(channel),
      });
    } else {
      return this.resolveExecutablePath();
    }
  }
}

function convertPuppeteerChannelToBrowsersChannel(
  channel: ChromeReleaseChannel
): BrowsersChromeReleaseChannel {
  switch (channel) {
    case 'chrome':
      return BrowsersChromeReleaseChannel.STABLE;
    case 'chrome-dev':
      return BrowsersChromeReleaseChannel.DEV;
    case 'chrome-beta':
      return BrowsersChromeReleaseChannel.BETA;
    case 'chrome-canary':
      return BrowsersChromeReleaseChannel.CANARY;
  }
}

/**
 * Extracts all features from the given command-line flag
 * (e.g. `--enable-features`, `--enable-features=`).
 *
 * Example input:
 * ["--enable-features=NetworkService,NetworkServiceInProcess", "--enable-features=Foo"]
 *
 * Example output:
 * ["NetworkService", "NetworkServiceInProcess", "Foo"]
 *
 * @internal
 */
export function getFeatures(flag: string, options: string[] = []): string[] {
  return options
    .filter(s => {
      return s.startsWith(flag.endsWith('=') ? flag : `${flag}=`);
    })
    .map(s => {
      return s.split(new RegExp(`${flag}` + '=\\s*'))[1]?.trim();
    })
    .filter(s => {
      return s;
    }) as string[];
}

/**
 * Removes all elements in-place from the given string array
 * that match the given command-line flag.
 *
 * @internal
 */
export function removeMatchingFlags(array: string[], flag: string): string[] {
  const regex = new RegExp(`^${flag}=.*`);
  let i = 0;
  while (i < array.length) {
    if (regex.test(array[i]!)) {
      array.splice(i, 1);
    } else {
      i++;
    }
  }
  return array;
}
