import {accessSync} from 'fs';
import {mkdtemp} from 'fs/promises';
import os from 'os';
import path from 'path';

import {Browser} from '../api/Browser.js';
import {CDPBrowser} from '../common/Browser.js';
import {assert} from '../util/assert.js';

import {BrowserRunner} from './BrowserRunner.js';
import {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {ProductLauncher} from './ProductLauncher.js';
import {PuppeteerNode} from './PuppeteerNode.js';

/**
 * @internal
 */
export class ChromeLauncher extends ProductLauncher {
  constructor(puppeteer: PuppeteerNode) {
    super(puppeteer, 'chrome');
  }

  override async launch(
    options: PuppeteerNodeLaunchOptions = {}
  ): Promise<Browser> {
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
      protocol,
      protocolTimeout,
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
        preferredRevision: this.puppeteer.browserRevision,
        protocolTimeout,
      });

      if (protocol === 'webDriverBiDi') {
        try {
          const BiDi = await import(
            /* webpackIgnore: true */ '../common/bidi/bidi.js'
          );
          const bidiConnection = await BiDi.connectBidiOverCDP(connection);
          browser = await BiDi.Browser.create({
            connection: bidiConnection,
            closeCallback: runner.close.bind(runner),
            process: runner.proc,
          });
        } catch (error) {
          runner.kill();
          throw error;
        }

        return browser;
      }

      browser = await CDPBrowser._create(
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

  override defaultArgs(options: BrowserLaunchArgumentOptions = {}): string[] {
    // See https://github.com/GoogleChrome/chrome-launcher/blob/main/docs/chrome-flags-for-tools.md
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
      // AcceptCHFrame disabled because of crbug.com/1348106.
      '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-sync',
      '--enable-automation',
      // TODO(sadym): remove '--enable-blink-features=IdleDetection' once
      // IdleDetection is turned on by default.
      '--enable-blink-features=IdleDetection',
      '--enable-features=NetworkServiceInProcess2',
      '--export-tagged-pdf',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--password-store=basic',
      '--use-mock-keychain',
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
      return this.#executablePathForChannel(channel);
    } else {
      return this.resolveExecutablePath();
    }
  }

  /**
   * @internal
   */
  #executablePathForChannel(channel: ChromeReleaseChannel): string {
    const platform = os.platform();

    let chromePath: string | undefined;
    switch (platform) {
      case 'win32':
        switch (channel) {
          case 'chrome':
            chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome\\Application\\chrome.exe`;
            break;
          case 'chrome-beta':
            chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome Beta\\Application\\chrome.exe`;
            break;
          case 'chrome-canary':
            chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome SxS\\Application\\chrome.exe`;
            break;
          case 'chrome-dev':
            chromePath = `${process.env['PROGRAMFILES']}\\Google\\Chrome Dev\\Application\\chrome.exe`;
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
      accessSync(chromePath);
    } catch (error) {
      throw new Error(
        `Could not find Google Chrome executable for channel '${channel}' at '${chromePath}'.`
      );
    }

    return chromePath;
  }
}
