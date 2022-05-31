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
const { chromeLauncher } = require('@web/test-runner-chrome');

module.exports = {
  files: ['test-browser/**/*.spec.js'],
  browserStartTimeout: 60 * 1000,
  browsers: [
    chromeLauncher({
      async createPage({ browser }) {
        const page = await browser.newPage();
        page.evaluateOnNewDocument((wsEndpoint) => {
          window.__ENV__ = { wsEndpoint };
        }, browser.wsEndpoint());

        return page;
      },
    }),
  ],
  plugins: [
    {
      // turn expect UMD into an es module
      name: 'esmify-expect',
      transform(context) {
        if (context.path === '/node_modules/expect/build-es5/index.js') {
          return `const module = {}; const exports = {};\n${context.body};\n export default module.exports;`;
        }
      },
    },
  ],
};
