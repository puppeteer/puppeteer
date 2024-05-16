/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  connect,
  ExtensionTransport,
} from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

globalThis.testConnect = async url => {
  const tab = await chrome.tabs.create({
    url,
  });
  const browser = await connect({
    transport: await ExtensionTransport.connectTab(tab.id),
  });
  const [page] = await browser.pages();
  return await page.evaluate('document.title');
};
