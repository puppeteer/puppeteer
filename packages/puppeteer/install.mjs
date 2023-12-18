#!/usr/bin/env node

/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This file is part of public API.
 *
 * By default, the `puppeteer` package runs this script during the installation
 * process unless one of the env flags is provided.
 * `puppeteer-core` package doesn't include this step at all. However, it's
 * still possible to install a supported browser using this script when
 * necessary.
 */

try {
  const {downloadBrowser} = await (async () => {
    try {
      return await import('puppeteer/internal/node/install.js');
    } catch {
      console.warn(
        'Skipping browser installation because the Puppeteer build is not available. Run `npm install` again after you have re-built Puppeteer.'
      );
      process.exit(0);
    }
  })();
  downloadBrowser();
} catch (error) {
  console.warn('Browser download failed', error);
}
