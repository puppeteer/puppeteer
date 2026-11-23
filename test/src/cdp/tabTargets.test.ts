/**
 * @license
 * Copyright 2026 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {Target} from 'puppeteer-core/internal/api/Target.js';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';
import {waitEvent} from '../utils.js';

describe('Tab targets', function () {
  setupTestBrowserHooks();

  it('should report the tab target as the parent of the page target', async () => {
    const {page, browser, context} = await getTestState();
    const pageTarget = page.target();
    const tabTarget = pageTarget.parent()!;

    expect(tabTarget.type()).toBe('tab');
    expect(tabTarget.parent()).toBeUndefined();
    expect(tabTarget.subtype()).toBeUndefined();
    expect(pageTarget.subtype()).toBeUndefined();
    expect(browser.targets()).toContain(tabTarget);
    expect(context.targets()).toContain(tabTarget);
  });

  it('should return the same page for the tab target and its page target', async () => {
    const {page, context} = await getTestState();
    const tabTarget = page.target().parent()!;

    await expect(tabTarget.page()).resolves.toBe(page);
    await expect(tabTarget.asPage()).resolves.toBe(page);
    await expect(context.pages()).resolves.toEqual([page]);
  });

  it('should emit target events for the tab target and its page target', async () => {
    const {context} = await getTestState();

    const createdTargets: Target[] = [];
    const destroyedTargets: Target[] = [];
    context.on('targetcreated', target => {
      createdTargets.push(target);
    });
    context.on('targetdestroyed', target => {
      destroyedTargets.push(target);
    });

    const newPage = await context.newPage();
    const pageTarget = newPage.target();
    const tabTarget = pageTarget.parent()!;
    expect(createdTargets).toContain(tabTarget);
    expect(createdTargets).toContain(pageTarget);

    await Promise.all([
      waitEvent<Target>(context, 'targetdestroyed', target => {
        return target === tabTarget;
      }),
      newPage.close(),
    ]);
    expect(destroyedTargets).toContain(pageTarget);
    expect(destroyedTargets).toContain(tabTarget);
  });
});
