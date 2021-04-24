/**
 * Copyright 2018 Google Inc. All rights reserved.
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
  setupTestPageAndContextHooks,
  setupTestBrowserHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions
import utils from './utils.js';

describe('Input.drag', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();
  it('should emit a dragIntercepted event when dragged', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    const draggable = await page.$('#drag');
    const event = await draggable.drag({ x: 1, y: 1 });
    expect(event.data.items.length).toBe(1);
  });
  it('can be dropped', async () => {
    const { page, server } = getTestState();

    await page.goto(server.PREFIX + '/input/drag-and-drop.html');
    const draggable = await page.$('#drag');
    const dropzone = await page.$('#drop');
    const { data } = await draggable.drag({ x: 1, y: 1 });
    await dropzone.drop(data);
    expect(await page.evaluate(() => globalThis.dropped)).toBe(true);
  });
});
