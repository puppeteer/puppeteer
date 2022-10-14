/**
 * Copyright 2022 Google Inc. All rights reserved.
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
