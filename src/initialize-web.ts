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

import { Puppeteer } from './common/Puppeteer.js';

export const initializePuppeteerWeb = (packageName: string): Puppeteer => {
  const isPuppeteerCore = packageName === 'puppeteer-core';

  // puppeteer-core ignores environment variables
  return new Puppeteer(
    // Product root directory is undefined as we're not concerned about
    // downloading and installing browsers in the web environment.
    undefined,
    // Preferred revision is undefined as we use the browser we are running in.
    undefined,
    isPuppeteerCore,
    // Preferred product is undefined as we use the browser we are
    // running in.
    undefined
  );
};
