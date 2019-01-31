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


  beforeAll(async state => {
    state.defaultBrowserOptions = {
      handleSIGINT: false,
      executablePath: product === 'chromium' ? process.env.CHROME : process.env.FFOX,
      dumpio: !!process.env.DUMPIO,
      args: product === 'chromium' ? ['--no-sandbox'] : [],
    };
    if (product === 'firefox' && state.defaultBrowserOptions.executablePath) {
      await require('../misc/install-preferences')(state.defaultBrowserOptions.executablePath);
      console.log('RUNNING CUSTOM FIREFOX: ' + state.defaultBrowserOptions.executablePath);
    }
  });
  afterAll(state => {
    state.defaultBrowserOptions = undefined;
  });

  require('./launcher.spec.js').addTests({testRunner, expect, product, puppeteer});
  require('./ignorehttpserrors.spec.js').addTests({testRunner, expect, product, puppeteer});

  describe('Browser', () => {
    beforeAll(async state => {
      state.browser = await puppeteer.launch(state.defaultBrowserOptions);
    });

    afterAll(async state => {
      await state.browser.close();
      state.browser = null;
    });

    require('./browser.spec.js').addTests({testRunner, expect, product, puppeteer});
    require('./browsercontext.spec.js').addTests({testRunner, expect, product, puppeteer});

    describe('Page', () => {
      beforeEach(async state => {
        state.page = await state.browser.newPage();
      });

      afterEach(async state => {
        await state.page.close();
        state.page = null;
      });

      require('./page.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./evaluation.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./navigation.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./dialog.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./frame.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./jshandle.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./elementhandle.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./target.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./waittask.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./queryselector.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./emulation.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./screenshot.spec.js').addTests({testRunner, expect, product, puppeteer});

      // Input tests
      require('./keyboard.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./mouse.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./click.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./type.spec.js').addTests({testRunner, expect, product, puppeteer});
      require('./hover.spec.js').addTests({testRunner, expect, product, puppeteer});

      // Browser-specific page tests
      if (product === 'firefox')
        require('./firefoxonly.spec.js').addTests({testRunner, expect, product, puppeteer});
      else
        require('./chromiumonly.spec.js').addTests({testRunner, expect, product, puppeteer});
    });
  });
});


