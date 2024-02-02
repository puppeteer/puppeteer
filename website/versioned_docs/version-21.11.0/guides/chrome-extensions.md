# Chrome Extensions

Puppeteer can be used for testing Chrome Extensions.

:::caution

Extensions in Chrome/Chromium do not work in the old headless/`chrome-headless-shell`.

:::

The following is code for getting a handle to the
[background page](https://developer.chrome.com/extensions/background_pages) of
an extension whose source is located in `./my-extension`:

```ts
import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const pathToExtension = path.join(process.cwd(), 'my-extension');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
  const backgroundPageTarget = await browser.waitForTarget(
    target => target.type() === 'background_page'
  );
  const backgroundPage = await backgroundPageTarget.page();
  // Test the background page as you would any other page.
  await browser.close();
})();
```

:::note

Chrome Manifest V3 extensions have a background ServiceWorker of type
'service_worker', instead of a page of type 'background_page'.

:::

:::note

It is not yet possible to test extension popups or content scripts.

:::
