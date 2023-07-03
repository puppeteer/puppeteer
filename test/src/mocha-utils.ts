/**
 * Copyright 2020 Google Inc. All rights reserved.
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

import fs from 'fs';
import path from 'path';

import {TestServer} from '@pptr/testserver';
import {Protocol} from 'devtools-protocol';
import expect from 'expect';
import * as Mocha from 'mocha';
import puppeteer from 'puppeteer/lib/cjs/puppeteer/puppeteer.js';
import {Browser} from 'puppeteer-core/internal/api/Browser.js';
import {BrowserContext} from 'puppeteer-core/internal/api/BrowserContext.js';
import {Page} from 'puppeteer-core/internal/api/Page.js';
import {
  setLogCapture,
  getCapturedLogs,
} from 'puppeteer-core/internal/common/Debug.js';
import {
  PuppeteerLaunchOptions,
  PuppeteerNode,
} from 'puppeteer-core/internal/node/PuppeteerNode.js';
import {rmSync} from 'puppeteer-core/internal/node/util/fs.js';
import {isErrorLike} from 'puppeteer-core/internal/util/ErrorLike.js';
import sinon from 'sinon';

import {extendExpectWithToBeGolden} from './utils.js';

const product =
  process.env['PRODUCT'] || process.env['PUPPETEER_PRODUCT'] || 'chrome';

const alternativeInstall = process.env['PUPPETEER_ALT_INSTALL'] || false;

const headless = (process.env['HEADLESS'] || 'true').trim().toLowerCase() as
  | 'true'
  | 'false'
  | 'new';
const isHeadless = headless === 'true' || headless === 'new';
const isFirefox = product === 'firefox';
const isChrome = product === 'chrome';
const protocol = (process.env['PUPPETEER_PROTOCOL'] || 'cdp') as
  | 'cdp'
  | 'webDriverBiDi';

let extraLaunchOptions = {};
try {
  extraLaunchOptions = JSON.parse(process.env['EXTRA_LAUNCH_OPTIONS'] || '{}');
} catch (error) {
  if (isErrorLike(error)) {
    console.warn(
      `Error parsing EXTRA_LAUNCH_OPTIONS: ${error.message}. Skipping.`
    );
  } else {
    throw error;
  }
}

const defaultBrowserOptions = Object.assign(
  {
    handleSIGINT: true,
    executablePath: process.env['BINARY'],
    headless: headless === 'new' ? ('new' as const) : isHeadless,
    dumpio: !!process.env['DUMPIO'],
    protocol,
  },
  extraLaunchOptions
);

if (defaultBrowserOptions.executablePath) {
  console.warn(
    `WARN: running ${product} tests with ${defaultBrowserOptions.executablePath}`
  );
} else {
  const executablePath = puppeteer.executablePath();
  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `Browser is not downloaded at ${executablePath}. Run 'npm install' and try to re-run tests`
    );
  }
}

const processVariables: {
  product: string;
  alternativeInstall: string | boolean;
  headless: 'true' | 'false' | 'new';
  isHeadless: boolean;
  isFirefox: boolean;
  isChrome: boolean;
  protocol: 'cdp' | 'webDriverBiDi';
  defaultBrowserOptions: PuppeteerLaunchOptions;
} = {
  product,
  alternativeInstall,
  headless,
  isHeadless,
  isFirefox,
  isChrome,
  protocol,
  defaultBrowserOptions,
};

const setupServer = async () => {
  const assetsPath = path.join(__dirname, '../assets');
  const cachedPath = path.join(__dirname, '../assets', 'cached');

  const server = await TestServer.create(assetsPath);
  const port = server.port;
  server.enableHTTPCache(cachedPath);
  server.PORT = port;
  server.PREFIX = `http://localhost:${port}`;
  server.CROSS_PROCESS_PREFIX = `http://127.0.0.1:${port}`;
  server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;

  const httpsServer = await TestServer.createHTTPS(assetsPath);
  const httpsPort = httpsServer.port;
  httpsServer.enableHTTPCache(cachedPath);
  httpsServer.PORT = httpsPort;
  httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
  httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;

  return {server, httpsServer};
};

export const getTestState = async (
  options: {
    skipLaunch?: boolean;
    skipContextCreation?: boolean;
  } = {}
): Promise<PuppeteerTestState> => {
  const {skipLaunch = false, skipContextCreation = false} = options;

  state.defaultBrowserOptions = JSON.parse(
    JSON.stringify(processVariables.defaultBrowserOptions)
  );

  if (!state.puppeteer) {
    const {server, httpsServer} = await setupServer();

    state.puppeteer = puppeteer;
    state.server = server;
    state.httpsServer = httpsServer;
    state.isFirefox = processVariables.isFirefox;
    state.isChrome = processVariables.isChrome;
    state.isHeadless = processVariables.isHeadless;
    state.headless = processVariables.headless;
    state.puppeteerPath = path.resolve(
      path.join(__dirname, '..', '..', 'packages', 'puppeteer')
    );
  }

  if (!state.browser && !skipLaunch) {
    state.browser = await puppeteer.launch(
      processVariables.defaultBrowserOptions
    );
  }

  if (state.context) {
    await state.context.close();
    state.context = undefined;
    state.page = undefined;
  }

  if (!skipLaunch && !skipContextCreation) {
    state.context = await state.browser!.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  }

  state.server?.reset();
  state.httpsServer?.reset();

  return state as PuppeteerTestState;
};

const setupGoldenAssertions = (): void => {
  const suffix = processVariables.product.toLowerCase();
  const GOLDEN_DIR = path.join(__dirname, `../golden-${suffix}`);
  const OUTPUT_DIR = path.join(__dirname, `../output-${suffix}`);
  if (fs.existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR);
  }
  extendExpectWithToBeGolden(GOLDEN_DIR, OUTPUT_DIR);
};

setupGoldenAssertions();

interface PuppeteerTestState {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  puppeteer: PuppeteerNode;
  defaultBrowserOptions: PuppeteerLaunchOptions;
  server: TestServer;
  httpsServer: TestServer;
  isFirefox: boolean;
  isChrome: boolean;
  isHeadless: boolean;
  headless: 'true' | 'false' | 'new';
  puppeteerPath: string;
}
const state: Partial<PuppeteerTestState> = {};

export const itOnlyRegularInstall = (
  description: string,
  body: Mocha.AsyncFunc
): Mocha.Test => {
  if (processVariables.alternativeInstall || process.env['BINARY']) {
    return it.skip(description, body);
  } else {
    return it(description, body);
  }
};

if (
  process.env['MOCHA_WORKER_ID'] === undefined ||
  process.env['MOCHA_WORKER_ID'] === '0'
) {
  console.log(
    `Running unit tests with:
  -> product: ${processVariables.product}
  -> binary: ${
    processVariables.defaultBrowserOptions.executablePath ||
    path.relative(process.cwd(), puppeteer.executablePath())
  }
  -> mode: ${
    processVariables.isHeadless
      ? processVariables.headless === 'new'
        ? '--headless=new'
        : '--headless'
      : 'headful'
  }`
  );
}

process.on('unhandledRejection', reason => {
  throw reason;
});

const browserNotClosedError = new Error(
  'A manually launched browser was not closed!'
);
export const mochaHooks = {
  async afterAll(): Promise<void> {
    await state.browser?.close();
    await state.server?.stop();
    await state.httpsServer?.stop();
  },

  async afterEach(): Promise<void> {
    if (browserCleanups.length > 0) {
      await closeLaunched();
      (this as any).test.error(browserNotClosedError);
    }
    sinon.restore();
  },
};

declare module 'expect' {
  interface Matchers<R> {
    atLeastOneToContain(expected: string[]): R;
  }
}

expect.extend({
  atLeastOneToContain: (actual: string, expected: string[]) => {
    for (const test of expected) {
      try {
        expect(actual).toContain(test);
        return {
          pass: true,
          message: () => {
            return '';
          },
        };
      } catch (err) {}
    }

    return {
      pass: false,
      message: () => {
        return `"${actual}" didn't contain any of the strings ${JSON.stringify(
          expected
        )}`;
      },
    };
  },
});

export const expectCookieEquals = async (
  cookies: Protocol.Network.Cookie[],
  expectedCookies: Array<Partial<Protocol.Network.Cookie>>
): Promise<void> => {
  if (!processVariables.isChrome) {
    // Only keep standard properties when testing on a browser other than Chrome.
    expectedCookies = expectedCookies.map(cookie => {
      return {
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        name: cookie.name,
        path: cookie.path,
        secure: cookie.secure,
        session: cookie.session,
        size: cookie.size,
        value: cookie.value,
      };
    });
  }

  expect(cookies).toHaveLength(expectedCookies.length);
  for (let i = 0; i < cookies.length; i++) {
    expect(cookies[i]).toMatchObject(expectedCookies[i]!);
  }
};

/**
 * Use it if you want to capture debug logs for a specitic test suite in CI.
 * This describe function enables capturing of debug logs and would print them
 * only if a test fails to reduce the amount of output.
 */
export const describeWithDebugLogs = (
  description: string,
  body: (this: Mocha.Suite) => void
): Mocha.Suite | void => {
  describe(description + '-debug', () => {
    beforeEach(() => {
      setLogCapture(true);
    });

    afterEach(function () {
      if (this.currentTest?.state === 'failed') {
        console.log(
          `\n"${this.currentTest.fullTitle()}" failed. Here is a debug log:`
        );
        console.log(getCapturedLogs().join('\n') + '\n');
      }
      setLogCapture(false);
    });

    describe(description, body);
  });
};

export const shortWaitForArrayToHaveAtLeastNElements = async (
  data: unknown[],
  minLength: number,
  attempts = 3,
  timeout = 50
): Promise<void> => {
  for (let i = 0; i < attempts; i++) {
    if (data.length >= minLength) {
      break;
    }
    await new Promise(resolve => {
      return setTimeout(resolve, timeout);
    });
  }
};

export const createTimeout = <T>(
  n: number,
  value?: T
): Promise<T | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve(value);
    }, n);
  });
};

let browserCleanups: Array<() => Promise<void>> = [];

const closeLaunched = async () => {
  let cleanup = browserCleanups.pop();
  try {
    while (cleanup) {
      await cleanup();
      cleanup = browserCleanups.pop();
    }
  } catch (error) {
    // If the browser was closed by other mean swallow the error
    // and mark he browser as closed
    if ((error as any)?.message.includes('Connection closed')) {
      browserCleanups = [];
      return;
    }

    throw error;
  }
};

export const launch = async (
  launchOptions: PuppeteerLaunchOptions,
  options: {
    createContext?: boolean;
    createPage?: boolean;
  } = {}
): Promise<
  PuppeteerTestState & {
    close: () => Promise<void>;
  }
> => {
  const {createContext = true, createPage = true} = options;
  const initState = await getTestState({
    skipLaunch: true,
  });

  try {
    const browser = await puppeteer.launch({
      ...initState.defaultBrowserOptions,
      ...launchOptions,
    });
    browserCleanups.push(() => {
      return browser.close();
    });

    let context: BrowserContext;
    let page: Page;
    if (createContext) {
      context = await browser.createIncognitoBrowserContext();
      browserCleanups.push(() => {
        return context.close();
      });

      if (createPage) {
        page = await context.newPage();
        browserCleanups.push(() => {
          return page.close();
        });
      }
    }

    return {
      ...initState,
      browser,
      context: context!,
      page: page!,
      close: closeLaunched,
    };
  } catch (error) {
    await closeLaunched();

    throw error;
  }
};
