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
import {existsSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';

import {
  Browser as InstalledBrowser,
  CDP_WEBSOCKET_ENDPOINT_REGEX,
  launch,
  TimeoutError as BrowsersTimeoutError,
  WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX,
  computeExecutablePath,
} from '@puppeteer/browsers';

import type {Browser, BrowserCloseCallback} from '../api/Browser.js';
import {CdpBrowser} from '../cdp/Browser.js';
import {Connection} from '../cdp/Connection.js';
import {TimeoutError} from '../common/Errors.js';
import type {Product} from '../common/Product.js';
import {debugError} from '../common/util.js';
import type {Viewport} from '../common/Viewport.js';

import type {
  BrowserLaunchArgumentOptions,
  ChromeReleaseChannel,
  PuppeteerNodeLaunchOptions,
} from './LaunchOptions.js';
import {NodeWebSocketTransport as WebSocketTransport} from './NodeWebSocketTransport.js';
import {PipeTransport} from './PipeTransport.js';
import type {PuppeteerNode} from './PuppeteerNode.js';

/**
 * @internal
 */
export interface ResolvedLaunchArgs {
  isTempUserDataDir: boolean;
  userDataDir: string;
  executablePath: string;
  args: string[];
}

/**
 * Describes a launcher - a class that is able to create and launch a browser instance.
 *
 * @public
 */
export class ProductLauncher {
  #product: Product;

  /**
   * @internal
   */
  puppeteer: PuppeteerNode;

  /**
   * @internal
   */
  protected actualBrowserRevision?: string;

  /**
   * @internal
   */
  constructor(puppeteer: PuppeteerNode, product: Product) {
    this.puppeteer = puppeteer;
    this.#product = product;
  }

  get product(): Product {
    return this.#product;
  }

  async launch(options: PuppeteerNodeLaunchOptions = {}): Promise<Browser> {
    const {
      dumpio = false,
      env = process.env,
      handleSIGINT = true,
      handleSIGTERM = true,
      handleSIGHUP = true,
      ignoreHTTPSErrors = false,
      defaultViewport = {width: 800, height: 600},
      slowMo = 0,
      timeout = 30000,
      waitForInitialPage = true,
      protocol,
      protocolTimeout,
    } = options;

    const launchArgs = await this.computeLaunchArguments(options);

    const usePipe = launchArgs.args.includes('--remote-debugging-pipe');

    const onProcessExit = async () => {
      await this.cleanUserDataDir(launchArgs.userDataDir, {
        isTemp: launchArgs.isTempUserDataDir,
      });
    };

    const browserProcess = launch({
      executablePath: launchArgs.executablePath,
      args: launchArgs.args,
      handleSIGHUP,
      handleSIGTERM,
      handleSIGINT,
      dumpio,
      env,
      pipe: usePipe,
      onExit: onProcessExit,
    });

    let browser: Browser;
    let connection: Connection;
    let closing = false;

    const browserCloseCallback = async () => {
      if (closing) {
        return;
      }
      closing = true;
      await this.closeBrowser(browserProcess, connection);
    };

    try {
      if (this.#product === 'firefox' && protocol === 'webDriverBiDi') {
        browser = await this.createBiDiBrowser(
          browserProcess,
          browserCloseCallback,
          {
            timeout,
            protocolTimeout,
            slowMo,
            defaultViewport,
            ignoreHTTPSErrors,
          }
        );
      } else {
        if (usePipe) {
          connection = await this.createCdpPipeConnection(browserProcess, {
            timeout,
            protocolTimeout,
            slowMo,
          });
        } else {
          connection = await this.createCdpSocketConnection(browserProcess, {
            timeout,
            protocolTimeout,
            slowMo,
          });
        }
        if (protocol === 'webDriverBiDi') {
          browser = await this.createBiDiOverCdpBrowser(
            browserProcess,
            connection,
            browserCloseCallback,
            {
              timeout,
              protocolTimeout,
              slowMo,
              defaultViewport,
              ignoreHTTPSErrors,
            }
          );
        } else {
          browser = await CdpBrowser._create(
            this.product,
            connection,
            [],
            ignoreHTTPSErrors,
            defaultViewport,
            browserProcess.nodeProcess,
            browserCloseCallback,
            options.targetFilter
          );
        }
      }
    } catch (error) {
      void browserCloseCallback();
      if (error instanceof BrowsersTimeoutError) {
        throw new TimeoutError(error.message);
      }
      throw error;
    }

    if (waitForInitialPage && protocol !== 'webDriverBiDi') {
      await this.waitForPageTarget(browser, timeout);
    }

    return browser;
  }

  executablePath(channel?: ChromeReleaseChannel): string;
  executablePath(): string {
    throw new Error('Not implemented');
  }

  defaultArgs(object: BrowserLaunchArgumentOptions): string[];
  defaultArgs(): string[] {
    throw new Error('Not implemented');
  }

  /**
   * Set only for Firefox, after the launcher resolves the `latest` revision to
   * the actual revision.
   * @internal
   */
  getActualBrowserRevision(): string | undefined {
    return this.actualBrowserRevision;
  }

  /**
   * @internal
   */
  protected async computeLaunchArguments(
    options: PuppeteerNodeLaunchOptions
  ): Promise<ResolvedLaunchArgs>;
  protected async computeLaunchArguments(): Promise<ResolvedLaunchArgs> {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  protected async cleanUserDataDir(
    path: string,
    opts: {isTemp: boolean}
  ): Promise<void>;
  protected async cleanUserDataDir(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * @internal
   */
  protected async closeBrowser(
    browserProcess: ReturnType<typeof launch>,
    connection?: Connection
  ): Promise<void> {
    if (connection) {
      // Attempt to close the browser gracefully
      try {
        await connection.closeBrowser();
        await browserProcess.hasClosed();
      } catch (error) {
        debugError(error);
        await browserProcess.close();
      }
    } else {
      await browserProcess.close();
    }
  }

  /**
   * @internal
   */
  protected async waitForPageTarget(
    browser: Browser,
    timeout: number
  ): Promise<void> {
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

  /**
   * @internal
   */
  protected async createCdpSocketConnection(
    browserProcess: ReturnType<typeof launch>,
    opts: {timeout: number; protocolTimeout: number | undefined; slowMo: number}
  ): Promise<Connection> {
    const browserWSEndpoint = await browserProcess.waitForLineOutput(
      CDP_WEBSOCKET_ENDPOINT_REGEX,
      opts.timeout
    );
    const transport = await WebSocketTransport.create(browserWSEndpoint);
    return new Connection(
      browserWSEndpoint,
      transport,
      opts.slowMo,
      opts.protocolTimeout
    );
  }

  /**
   * @internal
   */
  protected async createCdpPipeConnection(
    browserProcess: ReturnType<typeof launch>,
    opts: {timeout: number; protocolTimeout: number | undefined; slowMo: number}
  ): Promise<Connection> {
    // stdio was assigned during start(), and the 'pipe' option there adds the
    // 4th and 5th items to stdio array
    const {3: pipeWrite, 4: pipeRead} = browserProcess.nodeProcess.stdio;
    const transport = new PipeTransport(
      pipeWrite as NodeJS.WritableStream,
      pipeRead as NodeJS.ReadableStream
    );
    return new Connection('', transport, opts.slowMo, opts.protocolTimeout);
  }

  /**
   * @internal
   */
  protected async createBiDiOverCdpBrowser(
    browserProcess: ReturnType<typeof launch>,
    connection: Connection,
    closeCallback: BrowserCloseCallback,
    opts: {
      timeout: number;
      protocolTimeout: number | undefined;
      slowMo: number;
      defaultViewport: Viewport | null;
      ignoreHTTPSErrors?: boolean;
    }
  ): Promise<Browser> {
    // TODO: use other options too.
    const BiDi = await import(/* webpackIgnore: true */ '../bidi/bidi.js');
    const bidiConnection = await BiDi.connectBidiOverCdp(connection);
    return await BiDi.BidiBrowser.create({
      connection: bidiConnection,
      closeCallback,
      process: browserProcess.nodeProcess,
      defaultViewport: opts.defaultViewport,
      ignoreHTTPSErrors: opts.ignoreHTTPSErrors,
    });
  }

  /**
   * @internal
   */
  protected async createBiDiBrowser(
    browserProcess: ReturnType<typeof launch>,
    closeCallback: BrowserCloseCallback,
    opts: {
      timeout: number;
      protocolTimeout: number | undefined;
      slowMo: number;
      defaultViewport: Viewport | null;
      ignoreHTTPSErrors?: boolean;
    }
  ): Promise<Browser> {
    const browserWSEndpoint =
      (await browserProcess.waitForLineOutput(
        WEBDRIVER_BIDI_WEBSOCKET_ENDPOINT_REGEX,
        opts.timeout
      )) + '/session';
    const transport = await WebSocketTransport.create(browserWSEndpoint);
    const BiDi = await import(/* webpackIgnore: true */ '../bidi/bidi.js');
    const bidiConnection = new BiDi.BidiConnection(
      browserWSEndpoint,
      transport,
      opts.slowMo,
      opts.protocolTimeout
    );
    // TODO: use other options too.
    return await BiDi.BidiBrowser.create({
      connection: bidiConnection,
      closeCallback,
      process: browserProcess.nodeProcess,
      defaultViewport: opts.defaultViewport,
      ignoreHTTPSErrors: opts.ignoreHTTPSErrors,
    });
  }

  /**
   * @internal
   */
  protected getProfilePath(): string {
    return join(
      this.puppeteer.configuration.temporaryDirectory ?? tmpdir(),
      `puppeteer_dev_${this.product}_profile-`
    );
  }

  /**
   * @internal
   */
  protected resolveExecutablePath(): string {
    let executablePath = this.puppeteer.configuration.executablePath;
    if (executablePath) {
      if (!existsSync(executablePath)) {
        throw new Error(
          `Tried to find the browser at the configured path (${executablePath}), but no executable was found.`
        );
      }
      return executablePath;
    }

    function productToBrowser(product?: Product) {
      switch (product) {
        case 'chrome':
          return InstalledBrowser.CHROME;
        case 'firefox':
          return InstalledBrowser.FIREFOX;
      }
      return InstalledBrowser.CHROME;
    }

    executablePath = computeExecutablePath({
      cacheDir: this.puppeteer.defaultDownloadPath!,
      browser: productToBrowser(this.product),
      buildId: this.puppeteer.browserRevision,
    });

    if (!existsSync(executablePath)) {
      if (this.puppeteer.configuration.browserRevision) {
        throw new Error(
          `Tried to find the browser at the configured path (${executablePath}) for revision ${this.puppeteer.browserRevision}, but no executable was found.`
        );
      }
      switch (this.product) {
        case 'chrome':
          throw new Error(
            `Could not find Chrome (ver. ${this.puppeteer.browserRevision}). This can occur if either\n` +
              ' 1. you did not perform an installation before running the script (e.g. `npm install`) or\n' +
              ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
              'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.'
          );
        case 'firefox':
          throw new Error(
            `Could not find Firefox (rev. ${this.puppeteer.browserRevision}). This can occur if either\n` +
              ' 1. you did not perform an installation for Firefox before running the script (e.g. `PUPPETEER_PRODUCT=firefox npm install`) or\n' +
              ` 2. your cache path is incorrectly configured (which is: ${this.puppeteer.configuration.cacheDirectory}).\n` +
              'For (2), check out our guide on configuring puppeteer at https://pptr.dev/guides/configuration.'
          );
      }
    }
    return executablePath;
  }
}
