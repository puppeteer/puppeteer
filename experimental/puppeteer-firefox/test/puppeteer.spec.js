/**
 * Copyright 2018 Google Inc. All rights reserved.
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
const path = require('path');
const GoldenUtils = require('./golden-utils');
const {Matchers} = require('@pptr/testrunner');

module.exports.addTests = ({testRunner, product, puppeteer}) => testRunner.describe(product, () => {
  const {describe, xdescribe, fdescribe} = testRunner;
  const {it, fit, xit} = testRunner;
  const {beforeAll, beforeEach, afterAll, afterEach} = testRunner;

  const GOLDEN_DIR = path.join(__dirname, 'golden-' + product);
  const OUTPUT_DIR = path.join(__dirname, 'output-' + product);
  const {expect} = new Matchers({
    toBeGolden: GoldenUtils.compare.bind(null, GOLDEN_DIR, OUTPUT_DIR)
  });

  const defaultBrowserOptions = {
    handleSIGINT: false,
    executablePath: product === 'chromium' ? process.env.CHROME : process.env.FFOX,
    dumpio: !!process.env.DUMPIO,
    args: product === 'chromium' ? ['--no-sandbox'] : [],
  };

  const testOptions = {testRunner, expect, product, puppeteer, defaultBrowserOptions};

  if (product === 'firefox' && defaultBrowserOptions.executablePath) {
    beforeAll(async () => {
      await require('../misc/install-preferences')(defaultBrowserOptions.executablePath);
      console.log('RUNNING CUSTOM FIREFOX: ' + defaultBrowserOptions.executablePath);
    });
  }

  require('./launcher.spec.js').addTests(testOptions);
  require('./ignorehttpserrors.spec.js').addTests(testOptions);

  describe('Browser', () => {
    beforeAll(async state => {
      state.browser = await puppeteer.launch(defaultBrowserOptions);
    });

    afterAll(async state => {
      await state.browser.close();
      state.browser = null;
    });

    require('./browser.spec.js').addTests(testOptions);
    require('./browsercontext.spec.js').addTests(testOptions);

    describe('Page', () => {
      beforeEach(async state => {
        state.context = await state.browser.createIncognitoBrowserContext();
        state.page = await state.context.newPage();
      });

      afterEach(async state => {
        await state.context.close();
        state.context = null;
        state.page = null;
      });

      require('./page.spec.js').addTests(testOptions);
      require('./evaluation.spec.js').addTests(testOptions);
      require('./navigation.spec.js').addTests(testOptions);
      require('./dialog.spec.js').addTests(testOptions);
      require('./frame.spec.js').addTests(testOptions);
      require('./jshandle.spec.js').addTests(testOptions);
      require('./elementhandle.spec.js').addTests(testOptions);
      require('./target.spec.js').addTests(testOptions);
      require('./waittask.spec.js').addTests(testOptions);
      require('./queryselector.spec.js').addTests(testOptions);
      require('./emulation.spec.js').addTests(testOptions);
      require('./screenshot.spec.js').addTests(testOptions);

      // Input tests
      require('./keyboard.spec.js').addTests(testOptions);
      require('./mouse.spec.js').addTests(testOptions);
      require('./click.spec.js').addTests(testOptions);
      require('./type.spec.js').addTests(testOptions);
      require('./hover.spec.js').addTests(testOptions);

      // Browser-specific page tests
      if (product === 'firefox')
        require('./firefoxonly.spec.js').addTests(testOptions);
      else
        require('./chromiumonly.spec.js').addTests(testOptions);
    });
  });
});


