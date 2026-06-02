/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import expect from 'expect';

import {getTestState, setupTestBrowserHooks} from '../mocha-utils.js';

describe('ElementHandle.backendNodeId', function () {
  setupTestBrowserHooks();

  it('should work', async () => {
    const {page} = await getTestState();
    using handle = await page.evaluateHandle('document');
    const id = await handle.asElement()!.backendNodeId();
    expect(id).toBeGreaterThan(0);
  });
});
