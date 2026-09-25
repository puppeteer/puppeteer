/**
 * @license
 * Copyright 2018 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import {assert} from 'chai';
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
    },
    {createContext: false},
  );

  it('service_worker target type should be available', async function () {
    const {browser} = state;
    const extensionId = await browser.installExtension(extensionPath);
    const serviceWorkerTarget = await browser.waitForTarget(target => {
      return target.type() === 'service_worker';
    });
    assert.ok(serviceWorkerTarget);
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
    const worker = await serviceWorkerTarget.worker();
    const result = await worker!.evaluate(() => {
      // @ts-expect-error different context.
      return globalThis.MAGIC;
    });
    assert.strictEqual(result, 42);
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
    assert.ok(target);

    const extensions = await browser.extensions();

    const extension = extensions.get(extensionId);

    assert.isDefined(extension);
    assert.strictEqual(extension?.name, 'Simple extension');
    assert.strictEqual(extension?.version, '0.1');
    assert.strictEqual(extension?.path, extensionPath);
    assert.isTrue(extension?.enabled);
    assert.strictEqual(extension?.id, extensionId);
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
    assert.isAbove(workers.length, 0);
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
    assert.ok(target);

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
    assert.ok(target);
    await browser.waitForTarget(target => {
      return (
        target.url().includes('popup.html') &&
        target.url().includes(extensionId)
      );
    });

    const pages = await extension!.pages();
    assert.isAtLeast(pages.length, 1);
    assert.isTrue(
      pages.some(p => {
        return p.url().includes('popup.html');
      }),
    );
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
    assert.ok(target);
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

    assert.strictEqual(message, 'hello from extension page');

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

    assert.strictEqual(message, messageToLog);
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
    assert.ok(target);

    let extensions = await browser.extensions();
    assert.isTrue(extensions.has(id));

    await browser.uninstallExtension(id);
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, id);

    extensions = await browser.extensions();
    assert.isFalse(extensions.has(id));
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
    assert.ok(target);

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
    assert.isTrue(isContentScript);

    await browser.uninstallExtension(extensionId);
    await context.close();
    const targets = browser.targets();
    assertNoServiceWorkerReported(targets, extensionId);
  });
});

function assertNoServiceWorkerReported(targets: Target[], id: string) {
  const target = targets.find(target => {
    return target.url().includes(id) && target.type() === 'service_worker';
  });
  assert(target === undefined);
}
