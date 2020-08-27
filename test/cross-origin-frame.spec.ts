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

import utils from './utils.js';
import {
  getTestState,
  setupTestBrowserHooks,
  setupTestPageAndContextHooks,
  itFailsFirefox,
} from './mocha-utils'; // eslint-disable-line import/extensions

describe('Cross-origin frame specs.', function () {
  setupTestBrowserHooks();
  setupTestPageAndContextHooks();

  // Test example to reproduce the debug OOPIF message.
  // To have the OOPIF debug message, replace `skip` with `only` in this test,
  // and run with `DEBUG="puppeteer:frame" HEADLESS=false npm run unit`.
  // TODO(sadym): Remove debug message once proper OOPIF support is
  // implemented: https://github.com/puppeteer/puppeteer/issues/2548
  describe.skip('Debug message in case of OOPIF', function () {
    itFailsFirefox('Force OOPIF', async () => {
      const { page, server } = getTestState();

      await page.goto(server.EMPTY_PAGE);
      await utils.attachFrame(page, 'frame1', 'https://example.com/');
    });
  });
});
