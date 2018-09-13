const path = require('path');
const fs = require('fs');
const puppeteer = require('../..');
const SimpleServer = require('../../test/server/SimpleServer');
const {TestRunner, Reporter, Matchers} = require('../testrunner/');

const puppeteerWebPath = path.join(__dirname, 'puppeteer-web.js');
if (!fs.existsSync(puppeteerWebPath))
  throw new Error(`puppeteer-web is not built; run "npm run bundle"`);
const puppeteerWeb = fs.readFileSync(puppeteerWebPath, 'utf8');

const testRunner = new TestRunner();
const {describe, fdescribe, xdescribe} = testRunner;
const {it, xit, fit} = testRunner;
const {afterAll, beforeAll, afterEach, beforeEach} = testRunner;
const {expect} = new Matchers();

const defaultBrowserOptions = {
  args: ['--no-sandbox']
};

beforeAll(async state => {
  const assetsPath = path.join(__dirname, '..', '..', 'test', 'assets');
  const port = 8998;
  state.server = await SimpleServer.create(assetsPath, port);
  state.serverConfig = {
    PREFIX: `http://localhost:${port}`,
    EMPTY_PAGE: `http://localhost:${port}/empty.html`,
  };
  state.browser = await puppeteer.launch(defaultBrowserOptions);
});

afterAll(async state => {
  await Promise.all([
    state.server.stop(),
    state.browser.close()
  ]);
  state.browser = null;
  state.server = null;
});

beforeEach(async state => {
  state.page = await state.browser.newPage();
  await state.page.evaluateOnNewDocument(puppeteerWeb);
  await state.page.addScriptTag({
    content: puppeteerWeb + '\n//# sourceURL=puppeteer-web.js'
  });
});

afterEach(async state => {
  await state.page.close();
  state.page = null;
});

describe('Puppeteer-Web', () => {
  it('should work over web socket', async({page, serverConfig}) => {
    const browser2 = await puppeteer.launch(defaultBrowserOptions);
    // Use in-page puppeteer to create a new page and navigate it to the EMPTY_PAGE
    await page.evaluate(async(browserWSEndpoint, serverConfig) => {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.connect({browserWSEndpoint});
      const page = await browser.newPage();
      await page.goto(serverConfig.EMPTY_PAGE);
    }, browser2.wsEndpoint(), serverConfig);
    const pageURLs = (await browser2.pages()).map(page => page.url()).sort();
    expect(pageURLs).toEqual([
      'about:blank',
      serverConfig.EMPTY_PAGE
    ]);
    await browser2.close();
  });
});

if (process.env.CI && testRunner.hasFocusedTestsOrSuites()) {
  console.error('ERROR: "focused" tests/suites are prohibitted on bots. Remove any "fit"/"fdescribe" declarations.');
  process.exit(1);
}

new Reporter(testRunner);
testRunner.run();
