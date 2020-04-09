const path = require('path');
const fs = require('fs');
const puppeteer = require('../..');
const {TestServer} = require('../testserver/');
const expect = require('expect');

const puppeteerWebPath = path.join(__dirname, 'puppeteer-web.js');
if (!fs.existsSync(puppeteerWebPath))
  throw new Error(`puppeteer-web is not built; run "npm run bundle"`);
const puppeteerWeb = fs.readFileSync(puppeteerWebPath, 'utf8');

const state = {};

before(async() => {
  const assetsPath = path.join(__dirname, '..', '..', 'test', 'assets');
  const port = 8998;
  state.server = await TestServer.create(assetsPath, port);
  state.serverConfig = {
    PREFIX: `http://localhost:${port}`,
    EMPTY_PAGE: `http://localhost:${port}/empty.html`,
  };
  state.browser = await puppeteer.launch();
});

after(async() => {
  await Promise.all([
    state.server.stop(),
    state.browser.close()
  ]);
  state.browser = null;
  state.server = null;
});

beforeEach(async() => {
  state.page = await state.browser.newPage();
  await state.page.evaluateOnNewDocument(puppeteerWeb);
  await state.page.addScriptTag({
    content: puppeteerWeb + '\n//# sourceURL=puppeteer-web.js'
  });
});

afterEach(async() => {
  await state.page.close();
  state.page = null;
});

describe('Puppeteer-Web', () => {
  it('should work over web socket', async() => {
    const {page, serverConfig} = state;
    const browser2 = await puppeteer.launch();
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
  it('should work over exposed DevTools protocol', async() => {
    const {browser, page, serverConfig} = state;
    // Expose devtools protocol binding into page.
    const session = await browser.target().createCDPSession();
    const pageInfo = (await session.send('Target.getTargets')).targetInfos.find(info => info.attached);
    await session.send('Target.exposeDevToolsProtocol', {targetId: pageInfo.targetId});
    await session.detach();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use in-page puppeteer to create a new page and navigate it to the EMPTY_PAGE
    await page.evaluate(async serverConfig  => {
      const puppeteer = require('puppeteer');
      window.cdp.close = () => {};
      const browser = await puppeteer.connect({transport: window.cdp});
      const page = await browser.newPage();
      await page.goto(serverConfig.EMPTY_PAGE);
    }, serverConfig);
    const pageURLs = (await browser.pages()).map(page => page.url()).sort();
    expect(pageURLs).toEqual([
      'about:blank',
      'about:blank',
      serverConfig.EMPTY_PAGE
    ]);
  });
});
