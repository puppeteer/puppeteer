/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
(async () => {
  const [, , puppeteerRoot, options] = process.argv;
  const browser = await require(puppeteerRoot).launch(JSON.parse(options));
  console.log(browser.wsEndpoint());
})();
