/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Browser as PuppeteerBrowser} from 'puppeteer';
import type {Browser as PuppeteerCoreBrowser} from 'puppeteer-core';
import {expectType} from 'tsd';

declare const browser: PuppeteerCoreBrowser;
declare const browser2: PuppeteerBrowser;

expectType<PuppeteerBrowser>(browser);
expectType<PuppeteerCoreBrowser>(browser2);
