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

  // Wait for the new tab to load before connecting.
  await new Promise(resolve => {
    function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });

  const browser = await connect({
    transport: await ExtensionTransport.connectTab(tab.id),
  });
  const [page] = await browser.pages();
  const title = await page.evaluate(() => {
    return document.title;
  });
  const frame = await page.waitForFrame(frame => {
    return frame.url().endsWith('iframe.html');
  });
  const frameTitle = await frame.evaluate(() => {
    return document.title;
  });
  await page.waitForNetworkIdle();
  return title + '|' + frameTitle;
};
