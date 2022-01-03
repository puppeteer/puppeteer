/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

import { assert } from '../common/assert.js';
import { BrowserFetcher } from './BrowserFetcher.js';
import { Browser } from '../common/Browser.js';
import { BrowserRunner } from './BrowserRunner.js';
import { promisify } from 'util';

const copyFileAsync = promisify(fs.copyFile);
const mkdtempAsync = promisify(fs.mkdtemp);
const writeFileAsync = promisify(fs.writeFile);

import {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';

import { Product } from '../common/Product.js';

const tmpDir = () => process.env.PUPPETEER_TMP_DIR || os.tmpdir();

/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 * @public
 */
export interface ProductLauncher {
  launch(object: PuppeteerNodeLaunchOptions);
  executablePath: (string?) => string;
  defaultArgs(object: BrowserLaunchArgumentOptions);
  product: Product;
}

/**
 * @internal
 */
class ChromeLauncher implements ProductLauncher {
  _projectRoot: string;
  _preferredRevision: string;
  _isPuppeteerCore: boolean;

  constructor(
    projectRoot: string,
    preferredRevision: string,
    isPuppeteerCore: boolean
  ) {
    this._projectRoot = projectRoot;
    this._preferredRevision = preferredRevision;
    this._isPuppeteerCore = isPuppeteerCore;
  }

  async launch(options: PuppeteerNodeLaunchOptions = {}): Promise<Browser> {
    const {
      ignoreDefaultArgs = false,
      args = [],
      dumpio = false,
      channel = null,
      executablePath = null,
      pipe = false,
      env = process.env,
      handleSIGINT = true,
      handleSIGTERM = true,
      handleSIGHUP = true,
      ignoreHTTPSErrors = false,
      defaultViewport = { width: 800, height: 600 },
      slowMo = 0,
      timeout = 30000,
      waitForInitialPage = true,
      debuggingPort = null,
    } = options;

    const chromeArguments = [];
    if (!ignoreDefaultArgs) chromeArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs))
      chromeArguments.push(
        ...this.defaultArgs(options).filter(
          (arg) => !ignoreDefaultArgs.includes(arg)
        )
      );
    else chromeArguments.push(...args);

    if (
      !chromeArguments.some((argument) =>
        argument.startsWith('--remote-debugging-')
      )
    ) {
      if (pipe) {
        assert(
          debuggingPort === null,
          'Browser should be launched with either pipe or debugging port - not both.'
        );
        chromeArguments.push('--remote-debugging-pipe');
      } else {
        chromeArguments.push(`--remote-debugging-port=${debuggingPort || 0}`);
      }
    }

    let userDataDir;
    let isTempUserDataDir = true;

    // Check for the user data dir argument, which will always be set even
    // with a custom directory specified via the userDataDir option.
    const userDataDirIndex = chromeArguments.findIndex((arg) => {
      return arg.startsWith('--user-data-dir');
    });

    if (userDataDirIndex !== -1) {
      userDataDir = chromeArguments[userDataDirIndex].split('=')[1];
      if (!fs.existsSync(userDataDir)) {
        throw new Error(`Chrome user data dir not found at '${userDataDir}'`);
      }

      isTempUserDataDir = false;
    } else {
      userDataDir = await mkdtempAsync(
        path.join(tmpDir(), 'puppeteer_dev_chrome_profile-')
      );
      chromeArguments.push(`--user-data-dir=${userDataDir}`);
    }

    let chromeExecutable = executablePath;

    if (channel) {
      // executablePath is detected by channel, so it should not be specified by user.
      assert(
        !executablePath,
        '`executablePath` must not be specified when `channel` is given.'
      );

      chromeExecutable = executablePathForChannel(channel);
    } else if (!executablePath) {
      // Use Intel x86 builds on Apple M1 until native macOS arm64
      // Chromium builds are available.
      if (os.platform() !== 'darwin' && os.arch() === 'arm64') {
        chromeExecutable = '/usr/bin/chromium-browser';
      } else {
        const { missingText, executablePath } = resolveExecutablePath(this);
        if (missingText) throw new Error(missingText);
        chromeExecutable = executablePath;
      }
    }

    const usePipe = chromeArguments.includes('--remote-debugging-pipe');
    const runner = new BrowserRunner(
      this.product,
      chromeExecutable,
      chromeArguments,
      userDataDir,
      isTempUserDataDir
    );
    runner.start({
      handleSIGHUP,
      handleSIGTERM,
      handleSIGINT,
      dumpio,
      env,
      pipe: usePipe,
    });

    let browser;
    try {
      const connection = await runner.setupConnection({
        usePipe,
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      browser = await Browser.create(
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner)
      );
    } catch (error) {
      runner.kill();
      throw error;
    }

    if (waitForInitialPage) {
      try {
        await browser.waitForTarget((t) => t.type() === 'page', { timeout });
      } catch (error) {
        await browser.close();
        throw error;
      }
    }

    return browser;
  }

  defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    const chromeArguments = [
      '--disable-background-networking',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-features=Translate',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--enable-automation',
      '--password-store=basic',
      '--use-mock-keychain',
      // TODO(sadym): remove '--enable-blink-features=IdleDetection'
      // once IdleDetection is turned on by default.
      '--enable-blink-features=IdleDetection',
      '--export-tagged-pdf',
    ];
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;
    if (userDataDir)
      chromeArguments.push(`--user-data-dir=${path.resolve(userDataDir)}`);
    if (devtools) chromeArguments.push('--auto-open-devtools-for-tabs');
    if (headless) {
      chromeArguments.push('--headless', '--hide-scrollbars', '--mute-audio');
    }
    if (args.every((arg) => arg.startsWith('-')))
      chromeArguments.push('about:blank');
    chromeArguments.push(...args);
    return chromeArguments;
  }

  executablePath(channel?: ChromeReleaseChannel): string {
    if (channel) {
      return executablePathForChannel(channel);
    } else {
      return resolveExecutablePath(this).executablePath;
    }
  }

  get product(): Product {
    return 'chrome';
  }
}

/**
 * @internal
 */
class FirefoxLauncher implements ProductLauncher {
  _projectRoot: string;
  _preferredRevision: string;
  _isPuppeteerCore: boolean;

  constructor(
    projectRoot: string,
    preferredRevision: string,
    isPuppeteerCore: boolean
  ) {
    this._projectRoot = projectRoot;
    this._preferredRevision = preferredRevision;
    this._isPuppeteerCore = isPuppeteerCore;
  }

  async launch(options: PuppeteerNodeLaunchOptions = {}): Promise<Browser> {
    const {
      ignoreDefaultArgs = false,
      args = [],
      dumpio = false,
      executablePath = null,
      pipe = false,
      env = process.env,
      handleSIGINT = true,
      handleSIGTERM = true,
      handleSIGHUP = true,
      ignoreHTTPSErrors = false,
      defaultViewport = { width: 800, height: 600 },
      slowMo = 0,
      timeout = 30000,
      extraPrefsFirefox = {},
      waitForInitialPage = true,
      debuggingPort = null,
    } = options;

    const firefoxArguments = [];
    if (!ignoreDefaultArgs) firefoxArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs))
      firefoxArguments.push(
        ...this.defaultArgs(options).filter(
          (arg) => !ignoreDefaultArgs.includes(arg)
        )
      );
    else firefoxArguments.push(...args);

    if (
      !firefoxArguments.some((argument) =>
        argument.startsWith('--remote-debugging-')
      )
    ) {
      if (pipe) {
        assert(
          debuggingPort === null,
          'Browser should be launched with either pipe or debugging port - not both.'
        );
      }
      firefoxArguments.push(`--remote-debugging-port=${debuggingPort || 0}`);
    }

    let userDataDir = null;
    let isTempUserDataDir = true;

    // Check for the profile argument, which will always be set even
    // with a custom directory specified via the userDataDir option.
    const profileArgIndex = firefoxArguments.findIndex((arg) => {
      return ['-profile', '--profile'].includes(arg);
    });

    if (profileArgIndex !== -1) {
      userDataDir = firefoxArguments[profileArgIndex + 1];
      if (!fs.existsSync(userDataDir)) {
        throw new Error(`Firefox profile not found at '${userDataDir}'`);
      }

      // When using a custom Firefox profile it needs to be populated
      // with required preferences.
      isTempUserDataDir = false;
      const prefs = this.defaultPreferences(extraPrefsFirefox);
      this.writePreferences(prefs, userDataDir);
    } else {
      userDataDir = await this._createProfile(extraPrefsFirefox);
      firefoxArguments.push('--profile');
      firefoxArguments.push(userDataDir);
    }

    await this._updateRevision();
    let firefoxExecutable = executablePath;
    if (!executablePath) {
      const { missingText, executablePath } = resolveExecutablePath(this);
      if (missingText) throw new Error(missingText);
      firefoxExecutable = executablePath;
    }

    const runner = new BrowserRunner(
      this.product,
      firefoxExecutable,
      firefoxArguments,
      userDataDir,
      isTempUserDataDir
    );
    runner.start({
      handleSIGHUP,
      handleSIGTERM,
      handleSIGINT,
      dumpio,
      env,
      pipe,
    });

    let browser;
    try {
      const connection = await runner.setupConnection({
        usePipe: pipe,
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      browser = await Browser.create(
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner)
      );
    } catch (error) {
      runner.kill();
      throw error;
    }

    if (waitForInitialPage) {
      try {
        await browser.waitForTarget((t) => t.type() === 'page', { timeout });
      } catch (error) {
        await browser.close();
        throw error;
      }
    }

    return browser;
  }

  executablePath(): string {
    return resolveExecutablePath(this).executablePath;
  }

  async _updateRevision(): Promise<void> {
    // replace 'latest' placeholder with actual downloaded revision
    if (this._preferredRevision === 'latest') {
      const browserFetcher = new BrowserFetcher(this._projectRoot, {
        product: this.product,
      });
      const localRevisions = await browserFetcher.localRevisions();
      if (localRevisions[0]) this._preferredRevision = localRevisions[0];
    }
  }

  get product(): Product {
    return 'firefox';
  }

  defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;

    const firefoxArguments = ['--no-remote'];

    if (os.platform() === 'darwin') firefoxArguments.push('--foreground');
    else if (os.platform().startsWith('win')) {
      firefoxArguments.push('--wait-for-browser');
    }
    if (userDataDir) {
      firefoxArguments.push('--profile');
      firefoxArguments.push(userDataDir);
    }
    if (headless) firefoxArguments.push('--headless');
    if (devtools) firefoxArguments.push('--devtools');
    if (args.every((arg) => arg.startsWith('-')))
      firefoxArguments.push('about:blank');
    firefoxArguments.push(...args);
    return firefoxArguments;
  }

  defaultPreferences(extraPrefs: { [x: string]: unknown }): {
    [x: string]: unknown;
  } {
    const server = 'dummy.test';

    const defaultPrefs = {
      // Make sure Shield doesn't hit the network.
      'app.normandy.api_url': '',
      // Disable Firefox old build background check
      'app.update.checkInstallTime': false,
      // Disable automatically upgrading Firefox
      'app.update.disabledForTesting': true,

      // Increase the APZ content response timeout to 1 minute
      'apz.content_response_timeout': 60000,

      // Prevent various error message on the console
      // jest-puppeteer asserts that no error message is emitted by the console
      'browser.contentblocking.features.standard':
        '-tp,tpPrivate,cookieBehavior0,-cm,-fp',

      // Enable the dump function: which sends messages to the system
      // console
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1543115
      'browser.dom.window.dump.enabled': true,
      // Disable topstories
      'browser.newtabpage.activity-stream.feeds.system.topstories': false,
      // Always display a blank page
      'browser.newtabpage.enabled': false,
      // Background thumbnails in particular cause grief: and disabling
      // thumbnails in general cannot hurt
      'browser.pagethumbnails.capturing_disabled': true,

      // Disable safebrowsing components.
      'browser.safebrowsing.blockedURIs.enabled': false,
      'browser.safebrowsing.downloads.enabled': false,
      'browser.safebrowsing.malware.enabled': false,
      'browser.safebrowsing.passwords.enabled': false,
      'browser.safebrowsing.phishing.enabled': false,

      // Disable updates to search engines.
      'browser.search.update': false,
      // Do not restore the last open set of tabs if the browser has crashed
      'browser.sessionstore.resume_from_crash': false,
      // Skip check for default browser on startup
      'browser.shell.checkDefaultBrowser': false,

      // Disable newtabpage
      'browser.startup.homepage': 'about:blank',
      // Do not redirect user when a milstone upgrade of Firefox is detected
      'browser.startup.homepage_override.mstone': 'ignore',
      // Start with a blank page about:blank
      'browser.startup.page': 0,

      // Do not allow background tabs to be zombified on Android: otherwise for
      // tests that open additional tabs: the test harness tab itself might get
      // unloaded
      'browser.tabs.disableBackgroundZombification': false,
      // Do not warn when closing all other open tabs
      'browser.tabs.warnOnCloseOtherTabs': false,
      // Do not warn when multiple tabs will be opened
      'browser.tabs.warnOnOpen': false,

      // Disable the UI tour.
      'browser.uitour.enabled': false,
      // Turn off search suggestions in the location bar so as not to trigger
      // network connections.
      'browser.urlbar.suggest.searches': false,
      // Disable first run splash page on Windows 10
      'browser.usedOnWindows10.introURL': '',
      // Do not warn on quitting Firefox
      'browser.warnOnQuit': false,

      // Defensively disable data reporting systems
      'datareporting.healthreport.documentServerURI': `http://${server}/dummy/healthreport/`,
      'datareporting.healthreport.logging.consoleEnabled': false,
      'datareporting.healthreport.service.enabled': false,
      'datareporting.healthreport.service.firstRun': false,
      'datareporting.healthreport.uploadEnabled': false,

      // Do not show datareporting policy notifications which can interfere with tests
      'datareporting.policy.dataSubmissionEnabled': false,
      'datareporting.policy.dataSubmissionPolicyBypassNotification': true,

      // DevTools JSONViewer sometimes fails to load dependencies with its require.js.
      // This doesn't affect Puppeteer but spams console (Bug 1424372)
      'devtools.jsonview.enabled': false,

      // Disable popup-blocker
      'dom.disable_open_during_load': false,

      // Enable the support for File object creation in the content process
      // Required for |Page.setFileInputFiles| protocol method.
      'dom.file.createInChild': true,

      // Disable the ProcessHangMonitor
      'dom.ipc.reportProcessHangs': false,

      // Disable slow script dialogues
      'dom.max_chrome_script_run_time': 0,
      'dom.max_script_run_time': 0,

      // Only load extensions from the application and user profile
      // AddonManager.SCOPE_PROFILE + AddonManager.SCOPE_APPLICATION
      'extensions.autoDisableScopes': 0,
      'extensions.enabledScopes': 5,

      // Disable metadata caching for installed add-ons by default
      'extensions.getAddons.cache.enabled': false,

      // Disable installing any distribution extensions or add-ons.
      'extensions.installDistroAddons': false,

      // Disabled screenshots extension
      'extensions.screenshots.disabled': true,

      // Turn off extension updates so they do not bother tests
      'extensions.update.enabled': false,

      // Turn off extension updates so they do not bother tests
      'extensions.update.notifyUser': false,

      // Make sure opening about:addons will not hit the network
      'extensions.webservice.discoverURL': `http://${server}/dummy/discoveryURL`,

      // Temporarily force disable BFCache in parent (https://bit.ly/bug-1732263)
      'fission.bfcacheInParent': false,

      // Force all web content to use a single content process
      'fission.webContentIsolationStrategy': 0,

      // Allow the application to have focus even it runs in the background
      'focusmanager.testmode': true,
      // Disable useragent updates
      'general.useragent.updates.enabled': false,
      // Always use network provider for geolocation tests so we bypass the
      // macOS dialog raised by the corelocation provider
      'geo.provider.testing': true,
      // Do not scan Wifi
      'geo.wifi.scan': false,
      // No hang monitor
      'hangmonitor.timeout': 0,
      // Show chrome errors and warnings in the error console
      'javascript.options.showInConsole': true,

      // Disable download and usage of OpenH264: and Widevine plugins
      'media.gmp-manager.updateEnabled': false,
      // Prevent various error message on the console
      // jest-puppeteer asserts that no error message is emitted by the console
      'network.cookie.cookieBehavior': 0,

      // Disable experimental feature that is only available in Nightly
      'network.cookie.sameSite.laxByDefault': false,

      // Do not prompt for temporary redirects
      'network.http.prompt-temp-redirect': false,

      // Disable speculative connections so they are not reported as leaking
      // when they are hanging around
      'network.http.speculative-parallel-limit': 0,

      // Do not automatically switch between offline and online
      'network.manage-offline-status': false,

      // Make sure SNTP requests do not hit the network
      'network.sntp.pools': server,

      // Disable Flash.
      'plugin.state.flash': 0,

      'privacy.trackingprotection.enabled': false,

      // Can be removed once Firefox 89 is no longer supported
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1710839
      'remote.enabled': true,

      // Don't do network connections for mitm priming
      'security.certerrors.mitm.priming.enabled': false,
      // Local documents have access to all other local documents,
      // including directory listings
      'security.fileuri.strict_origin_policy': false,
      // Do not wait for the notification button security delay
      'security.notification_enable_delay': 0,

      // Ensure blocklist updates do not hit the network
      'services.settings.server': `http://${server}/dummy/blocklist/`,

      // Do not automatically fill sign-in forms with known usernames and
      // passwords
      'signon.autofillForms': false,
      // Disable password capture, so that tests that include forms are not
      // influenced by the presence of the persistent doorhanger notification
      'signon.rememberSignons': false,

      // Disable first-run welcome page
      'startup.homepage_welcome_url': 'about:blank',

      // Disable first-run welcome page
      'startup.homepage_welcome_url.additional': '',

      // Disable browser animations (tabs, fullscreen, sliding alerts)
      'toolkit.cosmeticAnimations.enabled': false,

      // Prevent starting into safe mode after application crashes
      'toolkit.startup.max_resumed_crashes': -1,
    };

    return Object.assign(defaultPrefs, extraPrefs);
  }

  /**
   * Populates the user.js file with custom preferences as needed to allow
   * Firefox's CDP support to properly function. These preferences will be
   * automatically copied over to prefs.js during startup of Firefox. To be
   * able to restore the original values of preferences a backup of prefs.js
   * will be created.
   *
   * @param prefs List of preferences to add.
   * @param profilePath Firefox profile to write the preferences to.
   */
  async writePreferences(
    prefs: { [x: string]: unknown },
    profilePath: string
  ): Promise<void> {
    const lines = Object.entries(prefs).map(([key, value]) => {
      return `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
    });

    await writeFileAsync(path.join(profilePath, 'user.js'), lines.join('\n'));

    // Create a backup of the preferences file if it already exitsts.
    const prefsPath = path.join(profilePath, 'prefs.js');
    if (fs.existsSync(prefsPath)) {
      const prefsBackupPath = path.join(profilePath, 'prefs.js.puppeteer');
      await copyFileAsync(prefsPath, prefsBackupPath);
    }
  }

  async _createProfile(extraPrefs: { [x: string]: unknown }): Promise<string> {
    const temporaryProfilePath = await mkdtempAsync(
      path.join(tmpDir(), 'puppeteer_dev_firefox_profile-')
    );

    const prefs = this.defaultPreferences(extraPrefs);
    await this.writePreferences(prefs, temporaryProfilePath);

    return temporaryProfilePath;
  }
}

function executablePathForChannel(channel: ChromeReleaseChannel): string {
  const platform = os.platform();

  let chromePath: string | undefined;
  switch (platform) {
    case 'win32':
      switch (channel) {
        case 'chrome':
          chromePath = `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`;
          break;
        case 'chrome-beta':
          chromePath = `${process.env.PROGRAMFILES}\\Google\\Chrome Beta\\Application\\chrome.exe`;
          break;
        case 'chrome-canary':
          chromePath = `${process.env.PROGRAMFILES}\\Google\\Chrome SxS\\Application\\chrome.exe`;
          break;
        case 'chrome-dev':
          chromePath = `${process.env.PROGRAMFILES}\\Google\\Chrome Dev\\Application\\chrome.exe`;
          break;
      }
      break;
    case 'darwin':
      switch (channel) {
        case 'chrome':
          chromePath =
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
          break;
        case 'chrome-beta':
          chromePath =
            '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
          break;
        case 'chrome-canary':
          chromePath =
            '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
          break;
        case 'chrome-dev':
          chromePath =
            '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev';
          break;
      }
      break;
    case 'linux':
      switch (channel) {
        case 'chrome':
          chromePath = '/opt/google/chrome/chrome';
          break;
        case 'chrome-beta':
          chromePath = '/opt/google/chrome-beta/chrome';
          break;
        case 'chrome-dev':
          chromePath = '/opt/google/chrome-unstable/chrome';
          break;
      }
      break;
  }

  if (!chromePath) {
    throw new Error(
      `Unable to detect browser executable path for '${channel}' on ${platform}.`
    );
  }

  // Check if Chrome exists and is accessible.
  try {
    fs.accessSync(chromePath);
  } catch (error) {
    throw new Error(
      `Could not find Google Chrome executable for channel '${channel}' at '${chromePath}'.`
    );
  }

  return chromePath;
}

function resolveExecutablePath(launcher: ChromeLauncher | FirefoxLauncher): {
  executablePath: string;
  missingText?: string;
} {
  let downloadPath: string;
  // puppeteer-core doesn't take into account PUPPETEER_* env variables.
  if (!launcher._isPuppeteerCore) {
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.npm_config_puppeteer_executable_path ||
      process.env.npm_package_config_puppeteer_executable_path;
    if (executablePath) {
      const missingText = !fs.existsSync(executablePath)
        ? 'Tried to use PUPPETEER_EXECUTABLE_PATH env variable to launch browser but did not find any executable at: ' +
          executablePath
        : null;
      return { executablePath, missingText };
    }
    downloadPath =
      process.env.PUPPETEER_DOWNLOAD_PATH ||
      process.env.npm_config_puppeteer_download_path ||
      process.env.npm_package_config_puppeteer_download_path;
  }
  const browserFetcher = new BrowserFetcher(launcher._projectRoot, {
    product: launcher.product,
    path: downloadPath,
  });

  if (!launcher._isPuppeteerCore && launcher.product === 'chrome') {
    const revision = process.env['PUPPETEER_CHROMIUM_REVISION'];
    if (revision) {
      const revisionInfo = browserFetcher.revisionInfo(revision);
      const missingText = !revisionInfo.local
        ? 'Tried to use PUPPETEER_CHROMIUM_REVISION env variable to launch browser but did not find executable at: ' +
          revisionInfo.executablePath
        : null;
      return { executablePath: revisionInfo.executablePath, missingText };
    }
  }
  const revisionInfo = browserFetcher.revisionInfo(launcher._preferredRevision);

  const firefoxHelp = `Run \`PUPPETEER_PRODUCT=firefox npm install\` to download a supported Firefox browser binary.`;
  const chromeHelp = `Run \`npm install\` to download the correct Chromium revision (${launcher._preferredRevision}).`;
  const missingText = !revisionInfo.local
    ? `Could not find expected browser (${launcher.product}) locally. ${
        launcher.product === 'chrome' ? chromeHelp : firefoxHelp
      }`
    : null;
  return { executablePath: revisionInfo.executablePath, missingText };
}

/**
 * @internal
 */
export default function Launcher(
  projectRoot: string,
  preferredRevision: string,
  isPuppeteerCore: boolean,
  product?: string
): ProductLauncher {
  // puppeteer-core doesn't take into account PUPPETEER_* env variables.
  if (!product && !isPuppeteerCore)
    product =
      process.env.PUPPETEER_PRODUCT ||
      process.env.npm_config_puppeteer_product ||
      process.env.npm_package_config_puppeteer_product;
  switch (product) {
    case 'firefox':
      return new FirefoxLauncher(
        projectRoot,
        preferredRevision,
        isPuppeteerCore
      );
    case 'chrome':
    default:
      if (typeof product !== 'undefined' && product !== 'chrome') {
        /* The user gave us an incorrect product name
         * we'll default to launching Chrome, but log to the console
         * to let the user know (they've probably typoed).
         */
        console.warn(
          `Warning: unknown product name ${product}. Falling back to chrome.`
        );
      }
      return new ChromeLauncher(
        projectRoot,
        preferredRevision,
        isPuppeteerCore
      );
  }
}
