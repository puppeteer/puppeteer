/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';

import {TestServer} from '@pptr/testserver';
import expect from 'expect';
import type * as MochaBase from 'mocha';
import puppeteer from 'puppeteer/lib/cjs/puppeteer/puppeteer.js';
import type {Browser} from 'puppeteer-core/internal/api/Browser.js';
import type {BrowserContext} from 'puppeteer-core/internal/api/BrowserContext.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';
import type {Cookie} from 'puppeteer-core/internal/common/Cookie.js';
import type {LaunchOptions} from 'puppeteer-core/internal/node/LaunchOptions.js';
import type {PuppeteerNode} from 'puppeteer-core/internal/node/PuppeteerNode.js';
import {rmSync} from 'puppeteer-core/internal/node/util/fs.js';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';
import {isErrorLike} from 'puppeteer-core/internal/util/ErrorLike.js';
import sinon from 'sinon';

import {extendExpectWithToBeGolden} from './utils.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Mocha {
    export interface SuiteFunction {
      /**
       * Use it if you want to capture debug logs for a specitic test suite in CI.
       * This describe function enables capturing of debug logs and would print them
       * only if a test fails to reduce the amount of output.
       */
      withDebugLogs: (
        description: string,
        body: (this: MochaBase.Suite) => void,
      ) => void;
    }
    export interface TestFunction {
      /*
       * Use to rerun the test and capture logs for the failed attempts
       * that way we don't push all the logs making it easier to read.
       */
      deflake: (
        repeats: number,
        title: string,
        fn: MochaBase.AsyncFunc,
      ) => void;
      /*
       * Use to rerun a single test and capture logs for the failed attempts
       */
      deflakeOnly: (
        repeats: number,
        title: string,
        fn: MochaBase.AsyncFunc,
      ) => void;
    }
  }
}

const product =
  process.env['PRODUCT'] || process.env['PUPPETEER_BROWSER'] || 'chrome';

const headless = (process.env['HEADLESS'] || 'true').trim().toLowerCase() as
  | 'true'
  | 'false'
  | 'shell';
export const isHeadless = headless === 'true' || headless === 'shell';
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
      `Error parsing EXTRA_LAUNCH_OPTIONS: ${error.message}. Skipping.`,
    );
  } else {
    throw error;
  }
}

const defaultBrowserOptions: LaunchOptions = Object.assign(
  {
    handleSIGINT: true,
    executablePath: process.env['BINARY'],
    headless: headless === 'shell' ? ('shell' as const) : isHeadless,
    dumpio: !!process.env['DUMPIO'],
    protocol,
    args: [],
    extraPrefsFirefox: {},
  } satisfies LaunchOptions,
  extraLaunchOptions,
);

// Required by tests and cannot be overridden by EXTRA_LAUNCH_OPTIONS.
defaultBrowserOptions.extraPrefsFirefox!['network.dns.localDomains'] =
  `domain1.test,domain2.test,domain3.test`;
defaultBrowserOptions.args!.push(
  `--host-resolver-rules=MAP domain1.test 127.0.0.1,MAP domain2.test 127.0.0.1,MAP domain3.test 127.0.0.1`,
);

if (defaultBrowserOptions.executablePath) {
  console.warn(
    `WARN: running ${product} tests with ${defaultBrowserOptions.executablePath}`,
  );
  if (!fs.existsSync(defaultBrowserOptions.executablePath)) {
    throw new Error(
      `Browser executable not found at ${defaultBrowserOptions.executablePath}`,
    );
  }
} else {
  const executablePath = puppeteer.executablePath();
  if (!fs.existsSync(executablePath)) {
    throw new Error(
      `Browser is not downloaded at ${executablePath}. Run 'npm install' and try to re-run tests`,
    );
  }
}

const processVariables: {
  product: string;
  headless: 'true' | 'false' | 'shell';
  isHeadless: boolean;
  isFirefox: boolean;
  isChrome: boolean;
  protocol: 'cdp' | 'webDriverBiDi';
  defaultBrowserOptions: LaunchOptions;
} = {
  product,
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

let browserPromise: Promise<Browser> | null = null;
export const setupTestBrowserHooks = (): void => {
  before(async function () {
    const defaultTimeout = this.timeout() ?? 0;
    // Double
    this.timeout(defaultTimeout * 2);
    try {
      if (!state.browser) {
        if (!browserPromise) {
          browserPromise = puppeteer.launch({
            ...processVariables.defaultBrowserOptions,
            timeout: defaultTimeout - 1_000,
            protocolTimeout: defaultTimeout * 2,
          });
        }

        state.browser = await browserPromise;
      }
    } catch (error) {
      console.error(error);
      // Intentionally empty as `getTestState` will throw
      // if browser is not found
    }
  });

  after(async () => {
    if (typeof gc !== 'undefined') {
      gc();
      const memory = process.memoryUsage();
      console.log('Memory stats:');
      for (const key of Object.keys(memory)) {
        console.log(
          key,
          // @ts-expect-error TS cannot the key type.
          `${Math.round(((memory[key] / 1024 / 1024) * 100) / 100)} MB`,
        );
      }
    }
  });

  afterEach(async () => {
    if (state.context) {
      await state.context.close();
      state.context = undefined;
      state.page = undefined;
    }
  });
};

export const setupSeparateTestBrowserHooks = (
  launchOptions: Readonly<LaunchOptions>,
  options: {
    createContext?: boolean;
    createPage?: boolean;
  } = {},
): Awaited<ReturnType<typeof launch>> => {
  const {createContext = true, createPage = true} = options;

  const state: Awaited<ReturnType<typeof launch>> = {} as any;
  before(async () => {
    const browserState = await launch(launchOptions, {
      after: 'all',
      ...options,
    });
    // Trick to keep the correct reference
    const props = Object.entries(browserState).reduce((acc, entries) => {
      const [key, value] = entries;
      acc[key] = {
        value,
        writable: true,
      };
      return acc;
    }, {} as PropertyDescriptorMap);
    Object.defineProperties(state, props);
  });

  if (createContext) {
    beforeEach(async () => {
      state.context = await state.browser.createBrowserContext();
      if (createPage) {
        state.page = await state.context.newPage();
      }
    });

    afterEach(async () => {
      await state.context.close();
    });
  }

  after(async () => {
    await state.close();
  });

  return state;
};

export const getTestState = async (
  options: {
    skipLaunch?: boolean;
    skipContextCreation?: boolean;
  } = {},
): Promise<PuppeteerTestState> => {
  const {skipLaunch = false, skipContextCreation = false} = options;

  state.defaultBrowserOptions = JSON.parse(
    JSON.stringify(processVariables.defaultBrowserOptions),
  );

  state.server?.reset();
  state.httpsServer?.reset();

  if (skipLaunch) {
    return state as PuppeteerTestState;
  }

  if (!state.browser) {
    throw new Error('Browser was not set-up in time!');
  } else if (!state.browser.connected) {
    throw new Error('Browser has disconnected!');
  }
  if (state.context) {
    throw new Error('Previous state was not cleared');
  }

  if (!skipContextCreation) {
    state.context = await state.browser.createBrowserContext();
    state.page = await state.context.newPage();
  }
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

export interface PuppeteerTestState {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  puppeteer: PuppeteerNode;
  defaultBrowserOptions: LaunchOptions;
  server: TestServer;
  httpsServer: TestServer;
  isFirefox: boolean;
  isChrome: boolean;
  isHeadless: boolean;
  headless: 'true' | 'false' | 'shell';
  puppeteerPath: string;
}
const state: Partial<PuppeteerTestState> = {};

if (
  process.env['MOCHA_WORKER_ID'] === undefined ||
  process.env['MOCHA_WORKER_ID'] === '0'
) {
  console.log(
    `Running tests with:
  -> product: ${processVariables.product}
  -> binary: ${
    processVariables.defaultBrowserOptions.executablePath ||
    path.relative(
      process.cwd(),
      puppeteer.executablePath({
        headless: isHeadless
          ? processVariables.headless === 'shell'
            ? 'shell'
            : true
          : false,
      }),
    )
  }
  -> mode: ${
    isHeadless
      ? processVariables.headless === 'shell'
        ? 'shell'
        : 'headless'
      : 'headful'
  }
  -> protocol: ${protocol}`,
  );
}

const browserNotClosedError = new Error(
  'A manually launched browser was not closed!',
);

export const mochaHooks: Mocha.RootHookObject = {
  async beforeAll(this: Mocha.Context): Promise<void> {
    async function setUpDefaultState() {
      const {server, httpsServer} = await setupServer();

      state.puppeteer = puppeteer;
      state.server = server;
      state.httpsServer = httpsServer;
      state.isFirefox = processVariables.isFirefox;
      state.isChrome = processVariables.isChrome;
      state.isHeadless = processVariables.isHeadless;
      state.headless = processVariables.headless;
      state.puppeteerPath = path.resolve(
        path.join(__dirname, '..', '..', 'packages', 'puppeteer'),
      );
    }

    try {
      await Deferred.race([
        setUpDefaultState(),
        Deferred.create({
          message: `Failed in after Hook`,
          timeout: this.timeout() - 1000,
        }),
      ]);
    } catch {}
  },

  async afterAll(this: Mocha.Context): Promise<void> {
    this.timeout(0);
    const lastTestFile = (this as any)?.test?.parent?.suites?.[0]?.file
      ?.split('/')
      ?.at(-1);
    try {
      await Promise.all([
        state.server?.stop(),
        state.httpsServer?.stop(),
        state.browser?.close(),
      ]);
    } catch {
      throw new Error(
        `Closing defaults (HTTP TestServer, HTTPS TestServer, Browser ) failed in ${lastTestFile}}`,
      );
    }
    if (browserCleanupsAfterAll.length > 0) {
      await closeLaunched(browserCleanupsAfterAll)();
      throw new Error(`Browser was not closed in ${lastTestFile}`);
    }
  },

  async afterEach(this: Mocha.Context): Promise<void> {
    const timeout = this.timeout();
    this.timeout(0);
    if (browserCleanups.length > 0) {
      (this.test as Mocha.Hook).error(browserNotClosedError);
      await Deferred.race([
        closeLaunched(browserCleanups)(),
        Deferred.create({
          message: `Failed in after Hook`,
          timeout: timeout - 1000,
        }),
      ]);
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
      } catch {}
    }

    return {
      pass: false,
      message: () => {
        return `"${actual}" didn't contain any of the strings ${JSON.stringify(
          expected,
        )}`;
      },
    };
  },
});

export const expectCookieEquals = async (
  cookies: Cookie[],
  expectedCookies: Array<Partial<Cookie>>,
): Promise<void> => {
  if (!processVariables.isChrome) {
    // Only keep standard properties when testing on a browser other than Chrome.
    expectedCookies = expectedCookies.map(cookie => {
      return Object.fromEntries(
        Object.entries(cookie).filter(([key]) => {
          return [
            'domain',
            'expires',
            'httpOnly',
            'name',
            'path',
            'secure',
            'session',
            'size',
            'value',
          ].includes(key);
        }),
      );
    });
  }

  expect(cookies).toHaveLength(expectedCookies.length);
  for (let i = 0; i < cookies.length; i++) {
    expect(cookies[i]).toMatchObject(expectedCookies[i]!);
  }
};

export const shortWaitForArrayToHaveAtLeastNElements = async (
  data: unknown[],
  minLength: number,
  attempts = 3,
  timeout = 50,
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
  value?: T,
): Promise<T | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => {
      return resolve(value);
    }, n);
  });
};

const browserCleanupsAfterAll: Array<() => Promise<void>> = [];
const browserCleanups: Array<() => Promise<void>> = [];

const closeLaunched = (storage: Array<() => Promise<void>>) => {
  return async () => {
    let cleanup = storage.pop();
    try {
      while (cleanup) {
        await cleanup();
        cleanup = storage.pop();
      }
    } catch (error) {
      // If the browser was closed by other means, swallow the error
      // and mark the browser as closed.
      if ((error as Error)?.message.includes('Connection closed')) {
        storage.splice(0, storage.length);
        return;
      }

      throw error;
    }
  };
};

export const launch = async (
  launchOptions: Readonly<LaunchOptions>,
  options: {
    after?: 'each' | 'all';
    createContext?: boolean;
    createPage?: boolean;
  } = {},
): Promise<
  PuppeteerTestState & {
    close: () => Promise<void>;
  }
> => {
  const {after = 'each', createContext = false, createPage = true} = options;
  const initState = await getTestState({
    skipLaunch: true,
  });
  const cleanupStorage =
    after === 'each' ? browserCleanups : browserCleanupsAfterAll;
  try {
    const args = [
      ...(initState.defaultBrowserOptions.args ?? []),
      ...(launchOptions.args ?? []),
    ];
    const browser = await puppeteer.launch({
      ...initState.defaultBrowserOptions,
      ...launchOptions,
      args,
    });
    cleanupStorage.push(() => {
      return browser.close();
    });

    let context: BrowserContext;
    let page: Page;
    if (createContext) {
      context = await browser.createBrowserContext();
      cleanupStorage.push(() => {
        return context.close();
      });

      if (createPage) {
        page = await context.newPage();
        cleanupStorage.push(() => {
          return page.close();
        });
      }
    }

    return {
      ...initState,
      browser,
      context: context!,
      page: page!,
      close: closeLaunched(cleanupStorage),
    };
  } catch (error) {
    await closeLaunched(cleanupStorage)();

    throw error;
  }
};
