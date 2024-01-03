/**
 * @license
 * Copyright 2022 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import puppeteer from 'puppeteer-core';

(async () => {
  try {
    await puppeteer.launch({
      product: '${product}',
      executablePath: 'node',
    });
  } catch (error) {
    if (error.message.includes('Failed to launch the browser process')) {
      process.exit(0);
    }
    console.error(error);
    process.exit(1);
  }
})();
