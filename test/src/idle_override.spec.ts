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

import expect from 'expect';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  describeFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions

describeFailsFirefox('Emulate idle state', () => {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  async function getIdleState() {
    const { page } = getTestState();

    const stateElement = await page.$('#state');
    return await page.evaluate((element: HTMLElement) => {
      return element.innerText;
    }, stateElement);
  }

  async function verifyState(expectedState: string) {
    const actualState = await getIdleState();
    expect(actualState).toEqual(expectedState);
  }

  it('changing idle state emulation causes change of the IdleDetector state', async () => {
    const { page, server, context } = getTestState();
    await context.overridePermissions(server.PREFIX + '/idle-detector.html', [
      'idle-detection',
    ]);

    await page.goto(server.PREFIX + '/idle-detector.html');

    // Store initial state, as soon as it is not guaranteed to be `active, unlocked`.
    const initialState = await getIdleState();

    // Emulate Idle states and verify IdleDetector updates state accordingly.
    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: false,
    });
    await verifyState('Idle state: idle, locked.');

    await page.emulateIdleState({
      isUserActive: true,
      isScreenUnlocked: false,
    });
    await verifyState('Idle state: active, locked.');

    await page.emulateIdleState({
      isUserActive: true,
      isScreenUnlocked: true,
    });
    await verifyState('Idle state: active, unlocked.');

    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: true,
    });
    await verifyState('Idle state: idle, unlocked.');

    // Remove Idle emulation and verify IdleDetector is in initial state.
    await page.emulateIdleState();
    await verifyState(initialState);

    // Emulate idle state again after removing emulation.
    await page.emulateIdleState({
      isUserActive: false,
      isScreenUnlocked: false,
    });
    await verifyState('Idle state: idle, locked.');

    // Remove emulation second time.
    await page.emulateIdleState();
    await verifyState(initialState);
  });
});
