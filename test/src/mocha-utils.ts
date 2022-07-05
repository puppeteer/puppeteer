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

import Protocol from 'devtools-protocol';
import expect from 'expect';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import rimraf from 'rimraf';
import sinon from 'sinon';
import {
  Browser,
  BrowserContext,
} from '../../lib/cjs/puppeteer/common/Browser.js';
import {Page} from '../../lib/cjs/puppeteer/common/Page.js';
import {isErrorLike} from '../../lib/cjs/puppeteer/common/util.js';
import {
  PuppeteerLaunchOptions,
  PuppeteerNode,
} from '../../lib/cjs/puppeteer/node/Puppeteer.js';
import puppeteer from '../../lib/cjs/puppeteer/puppeteer.js';
import {TestServer} from '../../utils/testserver/lib/index.js';
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
  process.env['PRODUCT'] || process.env['PUPPETEER_PRODUCT'] || 'Chromium';

const alternativeInstall = process.env['PUPPETEER_ALT_INSTALL'] || false;

const headless = (process.env['HEADLESS'] || 'true').trim().toLowerCase();
const isHeadless = headless === 'true' || headless === 'chrome';
const isFirefox = product === 'firefox';
const isChrome = product === 'Chromium';

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
    headless: headless === 'chrome' ? ('chrome' as const) : isHeadless,
    dumpio: !!process.env['DUMPIO'],
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
    if (product === 'firefox') {
      // @ts-expect-error _updateRevision is defined on the FF launcher
      // but not the Chrome one. The types need tidying so that TS can infer that
      // properly and not error here.
      await puppeteer._launcher._updateRevision();
    }
    const executablePath = puppeteer.executablePath();
    if (!fs.existsSync(executablePath)) {
      throw new Error(
        `Browser is not downloaded at ${executablePath}. Run 'npm install' and try to re-run tests`
      );
    }
  }
})();

declare module 'expect/build/types' {
  interface Matchers<R> {
    toBeGolden(x: string): R;
  }
}

const setupGoldenAssertions = (): void => {
  const suffix = product.toLowerCase();
  const GOLDEN_DIR = path.join(__dirname, `../golden-${suffix}`);
  const OUTPUT_DIR = path.join(__dirname, `../output-${suffix}`);
  if (fs.existsSync(OUTPUT_DIR)) {
    rimraf.sync(OUTPUT_DIR);
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
  headless: string;
  puppeteerPath: string;
}
const state: Partial<PuppeteerTestState> = {};

export const itFailsFirefox = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isFirefox) {
    return xit(description, body);
  } else {
    return it(description, body);
  }
};

export const itChromeOnly = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isChrome) {
    return it(description, body);
  } else {
    return xit(description, body);
  }
};

export const itHeadlessOnly = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isChrome && isHeadless === true) {
    return it(description, body);
  } else {
    return xit(description, body);
  }
};

export const itHeadfulOnly = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isChrome && isHeadless === false) {
    return it(description, body);
  } else {
    return xit(description, body);
  }
};

export const itFirefoxOnly = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (isFirefox) {
    return it(description, body);
  } else {
    return xit(description, body);
  }
};

export const itOnlyRegularInstall = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (alternativeInstall || process.env['BINARY']) {
    return xit(description, body);
  } else {
    return it(description, body);
  }
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

export const itFailsWindows = (
  description: string,
  body: Mocha.Func
): Mocha.Test => {
  if (os.platform() === 'win32') {
    return xit(description, body);
  }
  return it(description, body);
};

export const describeFailsFirefox = (
  description: string,
  body: (this: Mocha.Suite) => void
): void | Mocha.Suite => {
  if (isFirefox) {
    return xdescribe(description, body);
  } else {
    return describe(description, body);
  }
};

export const describeChromeOnly = (
  description: string,
  body: (this: Mocha.Suite) => void
): Mocha.Suite | void => {
  if (isChrome) {
    return describe(description, body);
  }
};

if (process.env['MOCHA_WORKER_ID'] === '0') {
  console.log(
    `Running unit tests with:
  -> product: ${product}
  -> binary: ${
    defaultBrowserOptions.executablePath ||
    path.relative(process.cwd(), puppeteer.executablePath())
  }
  -> mode: ${
    isHeadless
      ? headless === 'chrome'
        ? '--headless=chrome'
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
    await state.browser!.close();
    state.browser = undefined;
  });
};

export const setupTestPageAndContextHooks = (): void => {
  beforeEach(async () => {
    state.context = await state.browser!.createIncognitoBrowserContext();
    state.page = await state.context.newPage();
  });

  afterEach(async () => {
    await state.context!.close();
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
      state.puppeteerPath = path.resolve(path.join(__dirname, '../..'));
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
