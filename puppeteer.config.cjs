/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  chrome: {
    skipDownload: false,
  },
  ['chrome-headless-shell']: {
    skipDownload: false,
  },
  firefox: {
    skipDownload: false,
  },
};
