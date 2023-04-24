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

export const getTestState = (): PuppeteerTestState => {
  return state as PuppeteerTestState;
};

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
const protocol = process.env['PUPPETEER_PROTOCOL'] || 'cdp';

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
    protocol: protocol as 'cdp' | 'webDriverBiDi',
  },
  extraLaunchOptions
);

(async (): Promise<void> => {
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
})();

const setupGoldenAssertions = (): void => {
  const suffix = product.toLowerCase();
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
  if (alternativeInstall || process.env['BINARY']) {
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
  -> product: ${product}
  -> binary: ${
    defaultBrowserOptions.executablePath ||
    path.relative(process.cwd(), puppeteer.executablePath())
  }
  -> mode: ${
    isHeadless
      ? headless === 'new'
        ? '--headless=new'
        : '--headless'
      : 'headful'
  }`
  );
}

process.on('unhandledRejection', reason => {
  throw reason;
});

export const setupTestBrowserHooks = (): void => {
  before(async () => {
    const browser = await puppeteer.launch(defaultBrowserOptions);
    state.browser = browser;
  });

  after(async () => {
    await state.browser?.close();
    state.browser = undefined;
  });
};

export const setupTestPageAndContextHooks = (): void => {
  beforeEach(async () => {
    state.context = await state.browser!.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context?.close();
    state.context = undefined;
    state.page = undefined;
  });
};

export const mochaHooks = {
  beforeAll: [
    async (): Promise<void> => {
      const {server, httpsServer} = await setupServer();

      state.puppeteer = puppeteer;
      state.defaultBrowserOptions = defaultBrowserOptions;
      state.server = server;
      state.httpsServer = httpsServer;
      state.isFirefox = isFirefox;
      state.isChrome = isChrome;
      state.isHeadless = isHeadless;
      state.headless = headless;
      state.puppeteerPath = path.resolve(
        path.join(__dirname, '..', '..', 'packages', 'puppeteer')
      );
    },
  ],

  beforeEach: async (): Promise<void> => {
    state.server!.reset();
    state.httpsServer!.reset();
  },

  afterAll: [
    async (): Promise<void> => {
      await state.server!.stop();
      state.server = undefined;
      await state.httpsServer!.stop();
      state.httpsServer = undefined;
    },
  ],

  afterEach: (): void => {
    sinon.restore();
  },
};

export const expectCookieEquals = (
  cookies: Protocol.Network.Cookie[],
  expectedCookies: Array<Partial<Protocol.Network.Cookie>>
): void => {
  const {isChrome} = getTestState();
  if (!isChrome) {
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

  expect(cookies.length).toBe(expectedCookies.length);
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
