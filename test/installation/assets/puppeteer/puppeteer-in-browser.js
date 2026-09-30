import assert from 'node:assert/strict';

import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--remote-allow-origins=*'],
});

try {
  const port = process.argv[2];

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error);
  });

  await page.goto(`http://localhost:${port}/index.html`);

  await page.evaluate(() => {
    // Capture the native WebSocket used by Puppeteer's browser bundle.
    globalThis.WebSocket = class extends WebSocket {
      constructor(...args) {
        super(...args);
        globalThis.testWebSocket = this;
      }
    };
  });

  await page.type('input', browser.wsEndpoint());

  const [result] = await Promise.all([
    new Promise(resolve => {
      page.once('dialog', dialog => {
        dialog.accept();
        resolve(dialog.message());
      });
    }),
    page.click('button'),
  ]);

  const alert = await result;

  if (alert !== 'Browser has 2 pages') {
    throw new Error('Unexpected alert content: ' + alert);
  }

  const logs = await page.evaluate(() => {
    const error = new Event('error');
    const logs = [];
    const originalLog = console.log;
    const originalDebug = globalThis.__PUPPETEER_DEBUG;
    console.log = (prefix, event) => {
      logs.push({prefix, sameEvent: event === error});
    };
    try {
      globalThis.__PUPPETEER_DEBUG = 'puppeteer:error';
      globalThis.testWebSocket.dispatchEvent(error);
      // A disabled channel returns no logger and must remain silent.
      globalThis.__PUPPETEER_DEBUG = '';
      globalThis.testWebSocket.dispatchEvent(error);
    } finally {
      console.log = originalLog;
      globalThis.__PUPPETEER_DEBUG = originalDebug;
    }
    return logs;
  });
  assert.deepEqual(logs, [{prefix: 'puppeteer:error:', sameEvent: true}]);
  assert.deepEqual(pageErrors, []);
} finally {
  await browser.close();
}
