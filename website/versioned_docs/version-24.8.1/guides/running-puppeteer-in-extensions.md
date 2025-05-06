# Running Puppeteer in Chrome extensions

:::caution

Chrome extensions environment is significantly different from the usual Node.JS environment, therefore, the support for running Puppeteer in chrome.debugger
is currently experimental. Please submit issues https://github.com/puppeteer/puppeteer/issues/new/choose if you encounted bugs.

:::

Chrome Extensions allow accessing Chrome DevTools Protocol via [`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/api/debugger).
[`chrome.debugger`](https://developer.chrome.com/docs/extensions/reference/api/debugger) provides a restricted access to CDP and allows attaching to one
page at a time. Therefore, Puppeteer requires a different transport to be used and Puppeteer's view is limited to a single page. It means you can
interact with a single page and its frames and workers but cannot create new pages using Puppeteer. To create a new page you need to use the
[`chrome.tabs`](https://developer.chrome.com/docs/extensions/reference/api/tabs) API and establish a new Puppeteer connection.

## How to run Puppeteer in Chrome extensions

:::note

See https://github.com/puppeteer/puppeteer/tree/main/examples/puppeteer-in-extension for a complete example.

:::

To run Puppeteer in an extension, first you need to produce a browser-compatible build using a bundler such as rollup or webpack:

1. When importing Puppeteer use the browser-specific entrypoint from puppeteer-core `puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js'`:

```ts
import {
  connect,
  ExtensionTransport,
} from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

// Create a tab or find a tab to attach to.
const tab = await chrome.tabs.create({
  url,
});
// Connect Puppeteer using the ExtensionTransport.connectTab.
const browser = await connect({
  transport: await ExtensionTransport.connectTab(tab.id),
});
// You will have a single page on the browser object, which corresponds
// to the tab you connected the transport to.
const [page] = await browser.pages();
// Perform the usual operations with Puppeteer page.
console.log(await page.evaluate('document.title'));
browser.disconnect();
```

2. Build your extension using a bundler. For example, the following configuration can be used with rollup:

```js
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'main.mjs',
  output: {
    format: 'esm',
    dir: 'out',
  },
  // If you do not need to use WebDriver BiDi protocol,
  // exclude chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js to minimize the bundle size.
  external: ['chromium-bidi/lib/cjs/bidiMapper/BidiMapper.js'],
  plugins: [
    nodeResolve({
      // Indicate that we target a browser environment.
      browser: true,
      // Exclude any dependencies except for puppeteer-core.
      // `npm install puppeteer-core` # To install puppeteer-core if needed.
      resolveOnly: ['puppeteer-core'],
    }),
  ],
};
```
