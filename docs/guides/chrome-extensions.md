# Chrome Extensions

Puppeteer can be used for testing Chrome Extensions.

:::caution

Extensions are not available in chrome-headless-shell (headless: 'shell'),
also known as the old headless mode.

:::

:::note

See https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing for more details.

:::

The following is code for getting a handle to the
[background page](https://developer.chrome.com/extensions/background_pages) of
an extension whose source is located in `./my-extension`:

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});
const backgroundPageTarget = await browser.waitForTarget(
  target => target.type() === 'background_page',
);
const backgroundPage = await backgroundPageTarget.page();
// Test the background page as you would any other page.
await browser.close();
```

:::note

Chrome Manifest V3 extensions have a background ServiceWorker of type
'service_worker', instead of a page of type 'background_page'.

:::

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
});

const workerTarget = await browser.waitForTarget(
  // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
  target =>
    target.type() === 'service_worker' &&
    target.url().endsWith('background.js'),
);

const worker = await workerTarget.worker();

// Open a popup (available for Canary channels).
await worker.evaluate('chrome.action.openPopup();');

const popupTarget = await browser.waitForTarget(
  // Assumes that there is only one page with the URL ending with popup.html and that is the popup created by the extension.
  target => target.type() === 'page' && target.url().endsWith('popup.html'),
);

const popupPage = popupTarget.asPage();

// Test the popup page as you would any other page.

await browser.close();
```

:::note

It is not yet possible to test extension content scripts.

:::
