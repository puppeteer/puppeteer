import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(
  process.cwd(),
  'puppeteer-in-extension',
  'out',
);

const browser = await puppeteer.launch({
  headless: true,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
    '--silent-debugger-extension-api',
  ],
});

try {
  const port = process.argv[2];

  const workerTarget = await browser.waitForTarget(
    target =>
      target.type() === 'service_worker' &&
      target.url().endsWith('background.js'),
  );
  const worker = await workerTarget.worker();

  // See https://crbug.com/341213355
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = await worker.evaluate(async url => {
    return await globalThis.testConnect(url);
  }, `http://localhost:${port}/playground.html`);

  if (result !== 'Playground|Iframe') {
    throw new Error(
      'Unexpected playground.html+iframe.html page titles: ' + result,
    );
  }
} finally {
  await browser.close();
}
