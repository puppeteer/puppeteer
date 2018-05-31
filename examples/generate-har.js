// Details at: https://github.com/GoogleChrome/puppeteer/issues/1916

const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const har = new PuppeteerHar(page);
  await har.start({ path: 'results.har' });

  await page.goto('http://example.com');

  await har.stop();
  await browser.close();
})();
