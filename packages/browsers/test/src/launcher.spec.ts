/**
 * Copyright 2023 Google Inc. All rights reserved.
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

import {computeExecutablePath} from '../../lib/cjs/launcher.js';
import {Browser, BrowserPlatform} from '../../lib/cjs/browsers/browsers.js';

import assert from 'assert';
import path from 'path';

describe('launcher', () => {
  it('should compute executable path for Chrome', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.CHROME,
        platform: BrowserPlatform.LINUX,
        revision: '123',
        cacheDir: 'cache',
      }),
      path.join('cache', 'chrome', 'linux-123', 'chrome')
    );
  });
  it('should compute executable path for Firefox', () => {
    assert.strictEqual(
      computeExecutablePath({
        browser: Browser.FIREFOX,
        platform: BrowserPlatform.LINUX,
        revision: '123',
        cacheDir: 'cache',
      }),
      path.join('cache', 'firefox', 'linux-123', 'firefox', 'firefox')
    );
  });
});
