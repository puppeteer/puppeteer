/**
 * @license
 * Copyright 2024 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import puppeteer, {
  type Frame,
  type HTTPResponse,
  type Page,
  type connect,
  type defaultArgs,
  type executablePath,
  type launch,
} from 'puppeteer';
import {expectType} from 'tsd';

expectType<typeof launch>(puppeteer.launch);
expectType<typeof connect>(puppeteer.connect);
expectType<typeof defaultArgs>(puppeteer.defaultArgs);
expectType<typeof executablePath>(puppeteer.executablePath);

declare const page: Page;
declare const frame: Frame;
declare const url: URL;

expectType<Promise<HTTPResponse | null>>(page.goto(url));
expectType<Promise<HTTPResponse | null>>(frame.goto(url));
