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

import { BrowserFetcher } from './BrowserFetcher.js';
import { Browser } from '../common/Browser.js';
import { BrowserRunner } from './BrowserRunner.js';
import { promisify } from 'util';

const mkdtempAsync = promisify(fs.mkdtemp);
const writeFileAsync = promisify(fs.writeFile);

import {
  BrowserLaunchArgumentOptions,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import { Product } from '../common/Product.js';

/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 * @public
 */
export interface ProductLauncher {
  launch(object: PuppeteerNodeLaunchOptions);
  executablePath: () => string;
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
    } = options;

    const profilePath = path.join(os.tmpdir(), 'puppeteer_dev_chrome_profile-');
    const chromeArguments = [];
    if (!ignoreDefaultArgs) chromeArguments.push(...this.defaultArgs(options));
    else if (Array.isArray(ignoreDefaultArgs))
      chromeArguments.push(
        ...this.defaultArgs(options).filter(
          (arg) => !ignoreDefaultArgs.includes(arg)
        )
      );
    else chromeArguments.push(...args);

    let temporaryUserDataDir = null;

    if (
      !chromeArguments.some((argument) =>
        argument.startsWith('--remote-debugging-')
      )
    )
      chromeArguments.push(
        pipe ? '--remote-debugging-pipe' : '--remote-debugging-port=0'
      );
    if (!chromeArguments.some((arg) => arg.startsWith('--user-data-dir'))) {
      temporaryUserDataDir = await mkdtempAsync(profilePath);
      chromeArguments.push(`--user-data-dir=${temporaryUserDataDir}`);
    }

    let chromeExecutable = executablePath;
    if (!executablePath) {
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
      temporaryUserDataDir
    );
    runner.start({
      handleSIGHUP,
      handleSIGTERM,
      handleSIGINT,
      dumpio,
      env,
      pipe: usePipe,
    });

    try {
      const connection = await runner.setupConnection({
        usePipe,
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      const browser = await Browser.create(
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner)
      );
      await browser.waitForTarget((t) => t.type() === 'page');
      return browser;
    } catch (error) {
      runner.kill();
      throw error;
    }
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

  executablePath(): string {
    return resolveExecutablePath(this).executablePath;
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
    )
      firefoxArguments.push('--remote-debugging-port=0');

    let temporaryUserDataDir = null;

    if (
      !firefoxArguments.includes('-profile') &&
      !firefoxArguments.includes('--profile')
    ) {
      temporaryUserDataDir = await this._createProfile(extraPrefsFirefox);
      firefoxArguments.push('--profile');
      firefoxArguments.push(temporaryUserDataDir);
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
      temporaryUserDataDir
    );
    runner.start({
      handleSIGHUP,
      handleSIGTERM,
      handleSIGINT,
      dumpio,
      env,
      pipe,
    });

    try {
      const connection = await runner.setupConnection({
        usePipe: pipe,
        timeout,
        slowMo,
        preferredRevision: this._preferredRevision,
      });
      const browser = await Browser.create(
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner)
      );
      await browser.waitForTarget((t) => t.type() === 'page');
      return browser;
    } catch (error) {
      runner.kill();
      throw error;
    }
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
    const firefoxArguments = ['--no-remote', '--foreground'];
    if (os.platform().startsWith('win')) {
      firefoxArguments.push('--wait-for-browser');
    }
    const {
      devtools = false,
      headless = !devtools,
      args = [],
      userDataDir = null,
    } = options;
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

  async _createProfile(extraPrefs: { [x: string]: unknown }): Promise<string> {
    const profilePath = await mkdtempAsync(
      path.join(os.tmpdir(), 'puppeteer_dev_firefox_profile-')
    );
    const prefsJS = [];
    const userJS = [];
    const server = 'dummy.test';
    const defaultPreferences = {
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

      // Force disable Fission until the Remote Agent is compatible
      'fission.autostart': false,

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

      // Enable Remote Agent
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1544393
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

    Object.assign(defaultPreferences, extraPrefs);
    for (const [key, value] of Object.entries(defaultPreferences))
      userJS.push(
        `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`
      );
    await writeFileAsync(path.join(profilePath, 'user.js'), userJS.join('\n'));
    await writeFileAsync(
      path.join(profilePath, 'prefs.js'),
      prefsJS.join('\n')
    );
    return profilePath;
  }
}

function resolveExecutablePath(
  launcher: ChromeLauncher | FirefoxLauncher
): { executablePath: string; missingText?: string } {
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
