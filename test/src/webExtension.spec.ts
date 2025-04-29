/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';

const EXTENSION_PATH = path.join(__dirname, '/../assets/simple-extension');
const EXPECTED_ID = 'mbljndkcfjhaffohbnmoedabegpolpmd';

describe('webExtension', function () {
  setupTestBrowserHooks();

  it('can install and uninstall an extension', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });

    const options = Object.assign({}, defaultBrowserOptions);

    if (isChrome) {
      options.enableExtensions = true;
      options.pipe = true;
    }

    const {browser, close} = await launch(options);
    try {
      // Install an extension. Since the `key` field is present in the
      // manifest, this should always have the same ID.
      expect(await browser.installExtension(EXTENSION_PATH)).toBe(EXPECTED_ID);

      // Check we can uninstall the extension.
      await browser.uninstallExtension(EXPECTED_ID);
    } finally {
      await close();
    }
  });
});
