/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'node:path';

import expect from 'expect';

import {getTestState, launch, setupTestBrowserHooks} from './mocha-utils.js';

const EXTENSION_PATH = path.join(
  import.meta.dirname,
  '/../assets/simple-extension',
);
const EXTENSION_FIREFOX_PATH = path.join(
  import.meta.dirname,
  '/../assets/simple-extension-firefox',
);
const EXPECTED_ID = 'mbljndkcfjhaffohbnmoedabegpolpmd';

describe('webExtension', function () {
  setupTestBrowserHooks();

  it('can install and uninstall an extension', async () => {
    const {defaultBrowserOptions, isChrome} = await getTestState({
      skipLaunch: true,
    });

    const options = Object.assign({}, defaultBrowserOptions);
    const extensionPath = isChrome ? EXTENSION_PATH : EXTENSION_FIREFOX_PATH;
    // For Chrome, since the `key` field is present in the
    // manifest, this should always have the same ID.
    const expectedId = isChrome ? EXPECTED_ID : /temporary-addon/;
    if (isChrome) {
      options.enableExtensions = true;
      options.pipe = true;
    }

    const {browser, close} = await launch(options);
    try {
      const id = await browser.installExtension(extensionPath);
      expect(id).toMatch(expectedId);

      // Check we can uninstall the extension.
      await browser.uninstallExtension(id);
    } finally {
      await close();
    }
  });
});
