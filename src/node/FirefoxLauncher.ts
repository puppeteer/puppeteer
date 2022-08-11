import fs from 'fs';
import os from 'os';
import path from 'path';
import {assert} from '../common/assert.js';
import {Browser} from '../common/Browser.js';
import {Product} from '../common/Product.js';
import {BrowserFetcher} from './BrowserFetcher.js';
import {BrowserRunner} from './BrowserRunner.js';
import {
  BrowserLaunchArgumentOptions,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {ProductLauncher, resolveExecutablePath} from './ProductLauncher.js';
import {tmpdir} from './util.js';

/**
 * @internal
 */
export class FirefoxLauncher implements ProductLauncher {
  /**
   * @internal
   */
  _projectRoot: string | undefined;
  /**
   * @internal
   */
  _preferredRevision: string;
  /**
   * @internal
   */
  _isPuppeteerCore: boolean;

  constructor(
    projectRoot: string | undefined,
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
      defaultViewport = {width: 800, height: 600},
      slowMo = 0,
      timeout = 30000,
      extraPrefsFirefox = {},
      waitForInitialPage = true,
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
      const {missingText, executablePath} = resolveExecutablePath(this);
      if (missingText) {
        throw new Error(missingText);
      }
      firefoxExecutable = executablePath;
    }

    if (!firefoxExecutable) {
      throw new Error('firefoxExecutable is not found.');
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
      browser = await Browser._create(
        this.product,
        connection,
        [],
        ignoreHTTPSErrors,
        defaultViewport,
        runner.proc,
        runner.close.bind(runner),
        options.targetFilter
      );
    } catch (error) {
      runner.kill();
      throw error;
    }

    if (waitForInitialPage) {
      try {
        await browser.waitForTarget(
          t => {
            return t.type() === 'page';
          },
          {timeout}
        );
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
      if (!this._projectRoot) {
        throw new Error(
          '_projectRoot is undefined. Unable to create a BrowserFetcher.'
        );
      }
      const browserFetcher = new BrowserFetcher(this._projectRoot, {
        product: this.product,
      });
      const localRevisions = await browserFetcher.localRevisions();
      if (localRevisions[0]) {
        this._preferredRevision = localRevisions[0];
      }
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

  defaultPreferences(extraPrefs: {[x: string]: unknown}): {
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
   * @param prefs - List of preferences to add.
   * @param profilePath - Firefox profile to write the preferences to.
   */
  async writePreferences(
    prefs: {[x: string]: unknown},
    profilePath: string
  ): Promise<void> {
    const lines = Object.entries(prefs).map(([key, value]) => {
      return `user_pref(${JSON.stringify(key)}, ${JSON.stringify(value)});`;
    });

    await fs.promises.writeFile(
      path.join(profilePath, 'user.js'),
      lines.join('\n')
    );

    // Create a backup of the preferences file if it already exitsts.
    const prefsPath = path.join(profilePath, 'prefs.js');
    if (fs.existsSync(prefsPath)) {
      const prefsBackupPath = path.join(profilePath, 'prefs.js.puppeteer');
      await fs.promises.copyFile(prefsPath, prefsBackupPath);
    }
  }

  async _createProfile(extraPrefs: {[x: string]: unknown}): Promise<string> {
    const temporaryProfilePath = await fs.promises.mkdtemp(
      path.join(tmpdir(), 'puppeteer_dev_firefox_profile-')
    );

    const prefs = this.defaultPreferences(extraPrefs);
    await this.writePreferences(prefs, temporaryProfilePath);

    return temporaryProfilePath;
  }
}
