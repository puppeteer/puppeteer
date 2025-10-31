/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import {pathToFileURL} from 'node:url';

const [, , puppeteerRoot, options] = process.argv;
const puppeteer = (await import(pathToFileURL(puppeteerRoot))).default;
const browser = await puppeteer.launch(JSON.parse(options));
console.log(browser.wsEndpoint());
