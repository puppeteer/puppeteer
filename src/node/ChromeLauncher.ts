import fs from 'fs';
import path from 'path';
import {assert} from '../common/assert.js';
import {Browser} from '../common/Browser.js';
import {Product} from '../common/Product.js';
import {BrowserRunner} from './BrowserRunner.js';
import {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {
  executablePathForChannel,
  ProductLauncher,
  resolveExecutablePath,
} from './ProductLauncher.js';
import {tmpdir} from './util.js';

/**
 * @internal
 */
export class ChromeLauncher implements ProductLauncher {
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
      channel,
      executablePath,
      pipe = false,
      env = process.env,
      handleSIGINT = true,
      handleSIGTERM = true,
      handleSIGHUP = true,
      ignoreHTTPSErrors = false,
      defaultViewport = {width: 800, height: 600},
      slowMo = 0,
      timeout = 30000,
      waitForInitialPage = true,
      debuggingPort,
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
        `--user-data-dir=${await fs.promises.mkdtemp(
          path.join(tmpdir(), 'puppeteer_dev_chrome_profile-')
        )}`
      );
      userDataDirIndex = chromeArguments.length - 1;
    }

    const userDataDir = chromeArguments[userDataDirIndex]!.split('=', 2)[1];
    assert(typeof userDataDir === 'string', '`--user-data-dir` is malformed');

    let chromeExecutable = executablePath;
    if (channel) {
      // executablePath is detected by channel, so it should not be specified by user.
      assert(
        !chromeExecutable,
        '`executablePath` must not be specified when `channel` is given.'
      );

      chromeExecutable = executablePathForChannel(channel);
    } else if (!chromeExecutable) {
      const {missingText, executablePath} = resolveExecutablePath(this);
      if (missingText) {
        throw new Error(missingText);
      }
      chromeExecutable = executablePath;
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

  defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    const chromeArguments = [
      '--allow-pre-commit-input',
      '--disable-background-networking',
      '--enable-features=NetworkServiceInProcess2',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      // TODO: remove AvoidUnnecessaryBeforeUnloadCheckSync below
      // once crbug.com/1324138 is fixed and released.
      // AcceptCHFrame disabled because of crbug.com/1348106.
      '--disable-features=Translate,BackForwardCache,AcceptCHFrame,AvoidUnnecessaryBeforeUnloadCheckSync',
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
        headless === 'chrome' ? '--headless=chrome' : '--headless',
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

  executablePath(channel?: ChromeReleaseChannel): string {
    if (channel) {
      return executablePathForChannel(channel);
    } else {
      const results = resolveExecutablePath(this);
      return results.executablePath;
    }
  }

  get product(): Product {
    return 'chrome';
  }
}
