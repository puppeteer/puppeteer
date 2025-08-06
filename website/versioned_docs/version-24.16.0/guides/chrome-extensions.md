# Chrome Extensions

Puppeteer can be used for testing Chrome Extensions.

## Load extensions

### Using `LaunchOptions`

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});
```

### At runtime

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: true,
});

await browser.installExtension(pathToExtension);
```

## Background contexts

You can get a reference to the extension service worker or background page, which can be useful for evaluating code in the extension context or forcefully terminating the service worker.

### Service worker (MV3)

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});

const workerTarget = await browser.waitForTarget(
  // Assumes that there is only one service worker created by the extension and its URL ends with background.js.
  target =>
    target.type() === 'service_worker' &&
    target.url().endsWith('background.js'),
);

const worker = await workerTarget.worker();

// Test the service worker.

await browser.close();
```

### Background page (MV2)

The following is code for getting a handle to the
[background page](https://developer.chrome.com/extensions/background_pages) of
an extension whose source is located in `./my-extension`:

```ts
import puppeteer from 'puppeteer';
import path from 'path';

const pathToExtension = path.join(process.cwd(), 'my-extension');
const browser = await puppeteer.launch({
  pipe: true,
  enableExtensions: [pathToExtension],
});
const backgroundPageTarget = await browser.waitForTarget(
  target => target.type() === 'background_page',
);
const backgroundPage = await backgroundPageTarget.page();

// Test the background page as you would any other page.

await browser.close();
```

## Popup

Access the service worker [as above](#service-worker-mv3). Then:

```ts
await worker.evaluate('chrome.action.openPopup();');

const popupTarget = await browser.waitForTarget(
  // Assumes that there is only one page with the URL ending with popup.html
  // and that is the popup created by the extension.
  target => target.type() === 'page' && target.url().endsWith('popup.html'),
);

const popupPage = popupTarget.asPage();

// Test the popup page as you would any other page.

await browser.close();
```

## Content scripts

Content scripts are injected as normal. Use `browser.newPage()` and `page.goto()` to navigate to a page where a content script will be injected.

It is not currently possible to evaluate code in the content script isolated world.

## Learn more

To learn more, see the documentation on [Chrome for Developers](https://developer.chrome.com/docs/extensions/how-to/test/end-to-end-testing).
