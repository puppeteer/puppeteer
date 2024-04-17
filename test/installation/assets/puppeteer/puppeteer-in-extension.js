import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(
  process.cwd(),
  'puppeteer-in-extension',
  'out'
);

const browser = await puppeteer.launch({
  headless: true,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});

try {
  const port = process.argv[2];

  const workerTarget = await browser.waitForTarget(
    target =>
      target.type() === 'service_worker' &&
      target.url().endsWith('background.js')
  );
  const worker = await workerTarget.worker();
  const result = await worker.evaluate(async url => {
    while (!('testConnect' in globalThis)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return await globalThis.testConnect(url);
  }, `http://localhost:${port}/playground.html`);

  if (result !== 'Playground') {
    throw new Error('Unexpected playground.html page title: ' + result);
  }
} finally {
  await browser.close();
}
