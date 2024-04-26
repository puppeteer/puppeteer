/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// TODO: can rollup find the browser entrypoint?

import puppeteer from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

async function onConnectClick() {
  const wsUrl = document.querySelector('#ws').value;

  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
  });

  alert('Browser has ' + (await browser.pages()).length + ' pages');

  browser.disconnect();
}

globalThis.onConnectClick = onConnectClick;
