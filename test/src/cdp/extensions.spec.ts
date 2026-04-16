/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import path from 'node:path';

import expect from 'expect';
import type {Target} from 'puppeteer-core/internal/api/Target.js';
import type {ConsoleMessage} from 'puppeteer-core/internal/common/ConsoleMessage.js';

import {setupSeparateTestBrowserHooks} from '../mocha-utils.js';

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
      pipe: true,
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

  it('can evaluate in the service worker', async function () {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    const worker = await serviceWorkerTarget.worker()!;

    let result = '';
    // TODO: Chrome is flaky and MAGIC is sometimes not yet
    // defined. Generally, it should not be the case but it look like
    // there is a race condition between Runtime.evaluate and the
    // worker's main script execution.
    for (let i = 0; i < 5; i++) {
      try {
        result = await worker!.evaluate(() => {
          // @ts-expect-error different context.
          return globalThis.MAGIC;
        });
        break;
      } catch {}
      await new Promise(resolve => {
        return setTimeout(resolve, 200);
      });
    }
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
});

function assertNoServiceWorkerReported(targets: Target[], id: string) {
  const target = targets.find(target => {
    return target.url().includes(id) && target.type() === 'service_worker';
  });
  assert(target === undefined);
}
