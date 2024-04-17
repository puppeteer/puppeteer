/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {connect} from './main.js';

globalThis.testConnect = async url => {
  const tab = await chrome.tabs.create({
    url,
  });
  const tabId = tab.id;
  const browser = await connect(tabId);
  const [page] = await browser.pages();
  return await page.evaluate('document.title');
};
