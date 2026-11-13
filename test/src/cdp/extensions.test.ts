/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import path from 'node:path';

import expect from 'expect';
import type {HTTPRequest} from 'puppeteer-core/internal/api/HTTPRequest.js';
import type {HTTPResponse} from 'puppeteer-core/internal/api/HTTPResponse.js';
import type {Target} from 'puppeteer-core/internal/api/Target.js';
import {WebWorkerEvent} from 'puppeteer-core/internal/api/WebWorker.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

const extensionWithPagePath = path.join(
  import.meta.dirname,
  '..',
  '..',
  'assets',
  'extension-with-page',
);

const extensionPath = path.join(
  import.meta.dirname,
  '..',
  '..',
  'assets',
  'simple-extension',
);

describe('extensions', function () {
  const state = setupSeparateTestBrowserHooks(
    {
      enableExtensions: true,
    },
    {createContext: false},
  );

  it('service_worker target type should be available', async function () {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    expect(serviceWorkerTarget).toBeTruthy();
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should drop the previous service_worker target when re-installing an extension', async function () {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const firstWorkerTarget = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(firstWorkerTarget).toBeTruthy();

    const destroyedPromise = new Promise<Target>(resolve => {
      browser.once('targetdestroyed', target => {
        resolve(target);
      });
    });

    const reinstalledId = await browser.installExtension(extensionPath);
    expect(reinstalledId).toBe(extensionId);

    const destroyedTarget = await destroyedPromise;
    expect(destroyedTarget).toBe(firstWorkerTarget);

    const secondWorkerTarget = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) &&
        target.type() === 'service_worker' &&
        target !== firstWorkerTarget
      );
    });
    expect(secondWorkerTarget).toBeTruthy();

    const serviceWorkerTargets = browser.targets().filter(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(serviceWorkerTargets).toEqual([secondWorkerTarget]);

    await browser.uninstallExtension(extensionId);
    assertNoServiceWorkerReported(browser.targets(), extensionId);
  });

  it('can evaluate in the service worker', async function () {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    const worker = await serviceWorkerTarget.worker();
    const result = await worker!.evaluate(() => {
      // @ts-expect-error different context.
      return globalThis.MAGIC;
    });
    expect(result).toBe(42);
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should list extensions and their properties', async () => {
    const {browser} = state;

    const extensionId = await browser.installExtension(extensionPath);

    const target = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(target).toBeTruthy();

    const extensions = await browser.extensions();

    const extension = extensions.get(extensionId);

    expect(extension).toBeDefined();
    expect(extension?.name).toBe('Simple extension');
    expect(extension?.version).toBe('0.1');
    expect(extension?.path).toBe(extensionPath);
    expect(extension?.enabled).toBe(true);
    expect(extension?.id).toBe(extensionId);
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should list extension workers', async () => {
    const {browser} = state;

    const extensionId = await browser.installExtension(extensionPath);
    const extension = (await browser.extensions()).get(extensionId);

    const page = await browser.newPage();
    await extension?.triggerAction(page);

    await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });

    const workers = await extension!.workers();
    expect(workers.length).toBeGreaterThan(0);
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should trigger extension action', async () => {
    const {browser} = state;
    const page = await browser.newPage();
    const extensionId = await browser.installExtension(extensionPath);
    const extensions = await browser.extensions();
    const extension = extensions.get(extensionId);

    await page.triggerExtensionAction(extension!);
    // If it doesn't throw, we consider it successful for this level of testing.
    const target = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(target).toBeTruthy();

    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should list extension pages', async () => {
    const {browser, server} = state;
    const extensionId = await browser.installExtension(extensionWithPagePath);
    const extensions = await browser.extensions();
    const extension = extensions.get(extensionId);

    const page = await browser.newPage();
    await page.goto(server.EMPTY_PAGE);

    await extension?.triggerAction(page);
    const target = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(target).toBeTruthy();
    await browser.waitForTarget(target => {
      return (
        target.url().includes('popup.html') &&
        target.url().includes(extensionId)
      );
    });

    const pages = await extension!.pages();
    expect(pages.length).toBeGreaterThanOrEqual(1);
    expect(
      pages.some(p => {
        return p.url().includes('popup.html');
      }),
    ).toBe(true);
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should capture console logs from extension pages', async () => {
    const {browser, server} = state;
    const extensionId = await browser.installExtension(extensionWithPagePath);
    const extensions = await browser.extensions();
    const extension = extensions.get(extensionId);

    const page = await browser.newPage();
    await page.goto(server.EMPTY_PAGE);

    await page.triggerExtensionAction(extension!);

    const target = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(target).toBeTruthy();
    const optionsPageTarget = await browser.waitForTarget(target => {
      return (
        target.url().includes('popup.html') &&
        target.url().includes(extensionId)
      );
    });

    const extPage = await optionsPageTarget.asPage();

    const [message] = await Promise.all([
      new Promise<string>(resolve => {
        extPage.on('console', msg => {
          resolve(msg.text());
        });
      }),
      extPage.evaluate(() => {
        console.log('hello from extension page');
      }),
    ]);

    expect(message).toBe('hello from extension page');

    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should capture console logs from extension workers', async () => {
    const {browser, server} = state;
    const extensionId = await browser.installExtension(extensionWithPagePath);
    const extensions = await browser.extensions();
    const extension = extensions.get(extensionId);

    const page = await browser.newPage();
    await page.goto(server.EMPTY_PAGE);
    await extension?.triggerAction(page);

    const workerTarget = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });

    const worker = await workerTarget.worker();
    const messageToLog = 'hello from extension worker';

    const [message] = await Promise.all([
      new Promise<string>(resolve => {
        worker!.on('console', (msg: ConsoleMessage) => {
          const msgText = msg.text();
          if (msgText === messageToLog) {
            resolve(msg.text());
          }
        });
      }),
      worker!.evaluate(msg => {
        console.log(msg);
      }, messageToLog),
    ]);

    expect(message).toBe(messageToLog);
    await browser.uninstallExtension(extensionId);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  it('should remove extension from list after uninstall', async () => {
    const {browser} = state;
    const id = await browser.installExtension(extensionPath);

    const target = await browser.waitForTarget(target => {
      return target.url().includes(id) && target.type() === 'service_worker';
    });
    expect(target).toBeTruthy();

    let extensions = await browser.extensions();
    expect(extensions.has(id)).toBe(true);

    await browser.uninstallExtension(id);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, id);

    extensions = await browser.extensions();
    expect(extensions.has(id)).toBe(false);
  });

  it('should be available in Incognito profiles if enabledInIncognito is true', async () => {
    const {browser, server} = state;
    const extensionId = await browser.installExtension(extensionPath, {
      enabledInIncognito: true,
    });

    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.goto(server.EMPTY_PAGE);

    const target = await browser.waitForTarget(target => {
      return (
        target.url().includes(extensionId) && target.type() === 'service_worker'
      );
    });
    expect(target).toBeTruthy();

    const realms = page.extensionRealms();

    let contentScriptRealm;
    for (const realm of realms) {
      const extension = await realm.extension();
      if (extension && extension.id === extensionId) {
        contentScriptRealm = realm;
        break;
      }
    }
    assert(contentScriptRealm, 'realm should be defined');

    const isContentScript = await contentScriptRealm.evaluate(() => {
      return (globalThis as any).thisIsTheContentScript;
    });
    expect(isContentScript).toBe(true);

    await browser.uninstallExtension(extensionId);
    await context.close();
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });

  describe('service worker network events', function () {
    let extensionId: string | undefined;

    afterEach(async () => {
      if (extensionId) {
        await state.browser.uninstallExtension(extensionId);
        extensionId = undefined;
      }
    });

    async function installAndGetWorker() {
      const {browser} = state;
      const id = await browser.installExtension(extensionPath);
      extensionId = id;
      const target = await browser.waitForTarget(target => {
        return target.url().includes(id) && target.type() === 'service_worker';
      });
      return (await target.worker())!;
    }

    it('should report network requests on the service worker', async () => {
      const {server} = state;
      // The service worker runs on a chrome-extension:// origin.
      server.setRoute('/cors.json', (_req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        res.end('{}');
      });
      const worker = await installAndGetWorker();
      const url = server.PREFIX + '/cors.json';

      const [request, response, finished] = await Promise.all([
        waitEvent<HTTPRequest>(worker, WebWorkerEvent.Request, request => {
          return request.url() === url;
        }),
        waitEvent<HTTPResponse>(worker, WebWorkerEvent.Response, response => {
          return response.url() === url;
        }),
        waitEvent<HTTPRequest>(
          worker,
          WebWorkerEvent.RequestFinished,
          request => {
            return request.url() === url;
          },
        ),
        worker.evaluate(async (url: string) => {
          await (await fetch(url)).text();
        }, url),
      ]);

      expect(request.worker()).toBe(worker);
      expect(request.frame()).toBeNull();
      expect(request.page()).toBeNull();
      expect(response.request()).toBe(request);
      expect(response.status()).toBe(200);
      expect(finished).toBe(request);
    });

    it('should report failed network requests on the service worker', async () => {
      const {server} = state;
      server.setRoute('/fail', (req, _res) => {
        req.socket.destroy();
      });
      const worker = await installAndGetWorker();
      const url = server.PREFIX + '/fail';

      const [failed] = await Promise.all([
        waitEvent<HTTPRequest>(
          worker,
          WebWorkerEvent.RequestFailed,
          request => {
            return request.url() === url;
          },
        ),
        worker.evaluate(async (url: string) => {
          await fetch(url).catch(() => {});
        }, url),
      ]);

      expect(failed.worker()).toBe(worker);
      expect(failed.failure()?.errorText).toBeTruthy();
    });

    it('should not allow intercepting service worker requests', async () => {
      const {server} = state;
      const worker = await installAndGetWorker();

      const [request] = await Promise.all([
        waitEvent<HTTPRequest>(worker, WebWorkerEvent.Request, request => {
          return request.url() === server.EMPTY_PAGE;
        }),
        worker.evaluate(async (url: string) => {
          await fetch(url).catch(() => {});
        }, server.EMPTY_PAGE),
      ]);

      await expect(request.continue()).rejects.toThrow(
        'Request Interception is not enabled!',
      );
    });
  });
});

function assertNoServiceWorkerReported(targets: Target[], id: string) {
  const target = targets.find(target => {
    return target.url().includes(id) && target.type() === 'service_worker';
  });
  assert(target === undefined);
}
