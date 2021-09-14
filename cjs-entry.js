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

/**
 * We use `export default puppeteer` in `src/index.ts` to expose the library But
 * TypeScript in CJS mode compiles that to `exports.default = `. This means that
 * our CJS Node users would have to use `require('puppeteer').default` which
 * isn't very nice.
 *
 * So instead we expose this file as our entry point. This requires the compiled
 * Puppeteer output and re-exports the `default` export via `module.exports.`
 * This means that we can publish to CJS and ESM whilst maintaining the expected
 * import behaviour for CJS and ESM users.
 */
const puppeteerExport = require('./lib/cjs/puppeteer/node');
module.exports = puppeteerExport.default;
