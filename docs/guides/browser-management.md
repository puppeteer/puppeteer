# Browser management

Usually, you start working with Puppeteer by either [launching](https://pptr.dev/api/puppeteer.puppeteernode.launch) or [connecting](https://pptr.dev/api/puppeteer.puppeteernode.connect) to a browser.

## Launching a browser

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

const page = await browser.newPage();

// ...
```

## Closing a browser

To gracefully close the browser, you use the [`browser.close()`](https://pptr.dev/api/puppeteer.browser.close) method:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

const page = await browser.newPage();

await browser.close();
```

## Browser contexts

If you need to isolate your automation tasks, use [BrowserContexts](https://pptr.dev/api/puppeteer.browser.createbrowsercontext). Cookies and local storage are not shared between browser contexts. Also, you can close all pages in the context by closing the context.

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();

const context = await browser.createBrowserContext();

const page1 = await context.newPage();
const page2 = await context.newPage();

await context.close();
```

## Permissions

You can also configure permissions for a browser context:

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const context = browser.defaultBrowserContext();

await context.overridePermissions('https://html5demos.com', ['geolocation']);
```

## Connecting to a running browser

If you launched a browser outside of Puppeteer, you can connect to it using the [`connect`](https://pptr.dev/api/puppeteer.puppeteernode.connect) method. Usually, you can grab a WebSocket endpoint URL from the browser output:

```ts
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://127.0.0.1:9222/...',
});

const page = await browser.newPage();

browser.disconnect();
```

:::note

Unlike `browser.close()`, `browser.disconnect()` does not shut down the browser or close any pages.

:::
