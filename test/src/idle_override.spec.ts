/**
 * @license
 * Copyright 2020 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';
import type {ElementHandle} from 'puppeteer-core/internal/api/ElementHandle.js';
import type {Page} from 'puppeteer-core/internal/api/Page.js';

import {getTestState, setupTestBrowserHooks} from './mocha-utils.js';

describe('Emulate idle state', () => {
  setupTestBrowserHooks();

  async function getIdleState(page: Page) {
    using stateElement = (await page.$('#state')) as ElementHandle<HTMLElement>;
    return await page.evaluate(element => {
      return element.innerText;
    }, stateElement);
  }

  async function verifyState(page: Page, expectedState: string) {
    const actualState = await getIdleState(page);
    expect(actualState).toEqual(expectedState);
  }

  it('changing idle state emulation causes change of the IdleDetector state', async () => {
    const {page, server, context} = await getTestState();
    await context.overridePermissions(server.PREFIX + '/idle-detector.html', [
      'idle-detection',
    ]);

    await page.goto(server.PREFIX + '/idle-detector.html');

    // Store initial state, as soon as it is not guaranteed to be `active, unlocked`.
    const initialState = await getIdleState(page);

    // Emulate Idle states and verify IdleDetector updates state accordingly.
    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: false,
    });
    await verifyState(page, 'Idle state: idle, locked.');

    await page.emulateIdleState({
      isUserActive: true,
      isScreenUnlocked: false,
    });
    await verifyState(page, 'Idle state: active, locked.');

    await page.emulateIdleState({
      isUserActive: true,
      isScreenUnlocked: true,
    });
    await verifyState(page, 'Idle state: active, unlocked.');

    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: true,
    });
    await verifyState(page, 'Idle state: idle, unlocked.');

    // Remove Idle emulation and verify IdleDetector is in initial state.
    await page.emulateIdleState();
    await verifyState(page, initialState);

    // Emulate idle state again after removing emulation.
    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: false,
    });
    await verifyState(page, 'Idle state: idle, locked.');

    // Remove emulation second time.
    await page.emulateIdleState();
    await verifyState(page, initialState);
  });
});
