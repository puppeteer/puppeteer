/**
 * Copyright 2020 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { PuppeteerDeno } from './PuppeteerDeno.ts';
import { PUPPETEER_REVISIONS } from './revisions.ts';
export const initializePuppeteerDeno = (packageName: string) => {
  const isPuppeteerCore = packageName === 'puppeteer-core';
  // puppeteer-core ignores environment variables
  const productName = isPuppeteerCore
    ? undefined
    : Deno.env.get('PUPPETEER_PRODUCT') === 'firefox'
    ? 'firefox'
    : 'chrome';
  const preferredRevision =
    productName === 'firefox'
      ? PUPPETEER_REVISIONS.firefox
      : PUPPETEER_REVISIONS.chromium;

  return new PuppeteerDeno({
    preferredRevision,
    isPuppeteerCore,
    productName: productName,
  });
};
