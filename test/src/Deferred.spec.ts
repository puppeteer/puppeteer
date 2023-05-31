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

import expect from 'expect';
import {Deferred} from 'puppeteer-core/internal/util/Deferred.js';

describe('DeferredPromise', function () {
  it('should catch errors', async () => {
    // Async function before try/catch.
    async function task() {
      await new Promise(resolve => {
        return setTimeout(resolve, 50);
      });
    }
    // Async function that fails.
    function fails(): Deferred<void> {
      const deferred = Deferred.create<void>();
      setTimeout(() => {
        deferred.reject(new Error('test'));
      }, 25);
      return deferred;
    }

    const expectedToFail = fails();
    await task();
    let caught = false;
    try {
      await expectedToFail.valueOrThrow();
    } catch (err) {
      expect((err as Error).message).toEqual('test');
      caught = true;
    }
    expect(caught).toBeTruthy();
  });
});
