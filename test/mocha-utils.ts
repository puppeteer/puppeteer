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

import { TestServer } from '../utils/testserver/index.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import sinon from 'sinon';
import puppeteer from '../lib/cjs/puppeteer/node.js';
import {
  Browser,
  BrowserContext,
} from '../lib/cjs/puppeteer/common/Browser.js';
import { Page } from '../lib/cjs/puppeteer/common/Page.js';
import { PuppeteerNode } from '../lib/cjs/puppeteer/node/Puppeteer.js';
import utils from './utils.js';
import rimraf from 'rimraf';
import expect from 'expect';

import { trackCoverage } from './coverage-utils.js';

const setupServer = async () => {
  const assetsPath = path.join(__dirname, 'assets');
  const cachedPath = path.join(__dirname, 'assets', 'cached');

  const port = 8907;
  const server = await TestServer.create(assetsPath, port);
  server.enableHTTPCache(cachedPath);
  server.PORT = port;
  server.PREFIX = `http://localhost:${port}`;
  server.CROSS_PROCESS_PREFIX = `http://127.0.0.1:${port}`;
  server.EMPTY_PAGE = `http://localhost:${port}/empty.html`;

  const httpsPort = port + 1;
  const httpsServer = await TestServer.createHTTPS(assetsPath, httpsPort);
  httpsServer.enableHTTPCache(cachedPath);
  httpsServer.PORT = httpsPort;
  httpsServer.PREFIX = `https://localhost:${httpsPort}`;
  httpsServer.CROSS_PROCESS_PREFIX = `https://127.0.0.1:${httpsPort}`;
  httpsServer.EMPTY_PAGE = `https://localhost:${httpsPort}/empty.html`;

  return { server, httpsServer };
};

export const getTestState = (): PuppeteerTestState =>
  state as PuppeteerTestState;

const product =
  process.env.PRODUCT || process.env.PUPPETEER_PRODUCT || 'Chromium';

const alternativeInstall = process.env.PUPPETEER_ALT_INSTALL || false;

const isHeadless =
  (process.env.HEADLESS || 'true').trim().toLowerCase() === 'true';
const isFirefox = product === 'firefox';
const isChrome = product === 'Chromium';

let extraLaunchOptions = {};
try {
  extraLaunchOptions = JSON.parse(process.env.EXTRA_LAUNCH_OPTIONS || '{}');
} catch (error) {
  console.warn(
    `Error parsing EXTRA_LAUNCH_OPTIONS: ${error.message}. Skipping.`
  );
}

const defaultBrowserOptions = Object.assign(
  {
    handleSIGINT: true,
    executablePath: process.env.BINARY,
    headless: isHeadless,
    dumpio: !!process.env.DUMPIO,
  },
  extraLaunchOptions
);

(async (): Promise<void> => {
  if (defaultBrowserOptions.executablePath) {
    console.warn(
      `WARN: running ${product} tests with ${defaultBrowserOptions.executablePath}`
    );
  } else {
    // TODO(jackfranklin): declare updateRevision in some form for the Firefox
    // launcher.
    // @ts-expect-error _updateRevision is defined on the FF launcher
    // but not the Chrome one. The types need tidying so that TS can infer that
    // properly and not error here.
    if (product === 'firefox') await puppeteer._launcher._updateRevision();
    const executablePath = puppeteer.executablePath();
    if (!fs.existsSync(executablePath))
      throw new Error(
        `Browser is not downloaded at ${executablePath}. Run 'npm install' and try to re-run tests`
      );
  }
})();

declare module 'expect/build/types' {
  interface Matchers<R> {
    toBeGolden(x: string): R;
  }
}

const setupGoldenAssertions = (): void => {
  const suffix = product.toLowerCase();
  const GOLDEN_DIR = path.join(__dirname, 'golden-' + suffix);
  const OUTPUT_DIR = path.join(__dirname, 'output-' + suffix);
  if (fs.existsSync(OUTPUT_DIR)) rimraf.sync(OUTPUT_DIR);
  utils.extendExpectWithToBeGolden(GOLDEN_DIR, OUTPUT_DIR);
};

setupGoldenAssertions();

interface PuppeteerTestState {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  puppeteer: PuppeteerNode;
  defaultBrowserOptions: {
    [x: string]: any;
  };
  server: any;
  httpsServer: any;
  isFirefox: boolean;
  isChrome: boolean;
  isHeadless: boolean;
  puppeteerPath: string;
}
const state: Partial<PuppeteerTestState> = {};

export const itFailsFirefox = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isFirefox) return xit(description, body);
  else return it(description, body);
};

export const itChromeOnly = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isChrome) return it(description, body);
  else return xit(description, body);
};

export const itOnlyRegularInstall = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (alternativeInstall || process.env.BINARY) return xit(description, body);
  else return it(description, body);
};

export const itFailsWindowsUntilDate = (
  date: Date,
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (os.platform() === 'win32' && Date.now() < date.getTime()) {
    // we are within the deferred time so skip the test
    return xit(description, body);
  }

  return it(description, body);
};

export const itFailsWindows = (description: string, body: Mocha.Func) => {
  if (os.platform() === 'win32') {
    return xit(description, body);
  }
  return it(description, body);
};

export const describeFailsFirefox = (
  description: string,
  body: (this: Mocha.Suite) => void
): void | Mocha.Suite => {
  if (isFirefox) return xdescribe(description, body);
  else return describe(description, body);
};

export const describeChromeOnly = (
  description: string,
  body: (this: Mocha.Suite) => void
): Mocha.Suite => {
  if (isChrome) return describe(description, body);
};

let coverageHooks = {
  beforeAll: (): void => {},
  afterAll: (): void => {},
};

if (process.env.COVERAGE) {
  coverageHooks = trackCoverage();
}

console.log(
  `Running unit tests with:
  -> product: ${product}
  -> binary: ${
    defaultBrowserOptions.executablePath ||
    path.relative(process.cwd(), puppeteer.executablePath())
  }`
);

export const setupTestBrowserHooks = () => {
  before(async () => {
    const browser = await puppeteer.launch(defaultBrowserOptions);
    state.browser = browser;
  });

  after(async () => {
    await state.browser.close();
    state.browser = null;
  });
};

export const setupTestPageAndContextHooks = () => {
  beforeEach(async () => {
    state.context = await state.browser.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context.close();
    state.context = null;
    state.page = null;
  });
};

export const mochaHooks = {
  beforeAll: [
    async () => {
      const { server, httpsServer } = await setupServer();

      state.puppeteer = puppeteer;
      state.defaultBrowserOptions = defaultBrowserOptions;
      state.server = server;
      state.httpsServer = httpsServer;
      state.isFirefox = isFirefox;
      state.isChrome = isChrome;
      state.isHeadless = isHeadless;
      state.puppeteerPath = path.resolve(path.join(__dirname, '..'));
    },
    coverageHooks.beforeAll,
  ],

  beforeEach: async () => {
    state.server.reset();
    state.httpsServer.reset();
  },

  afterAll: [
    async () => {
      await state.server.stop();
      state.server = null;
      await state.httpsServer.stop();
      state.httpsServer = null;
    },
    coverageHooks.afterAll,
  ],

  afterEach: () => {
    sinon.restore();
  },
};

export const expectCookieEquals = (cookies, expectedCookies) => {
  const { isChrome } = getTestState();
  if (!isChrome) {
    // Only keep standard properties when testing on a browser other than Chrome.
    expectedCookies = expectedCookies.map((cookie) => {
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

  expect(cookies).toEqual(expectedCookies);
};
