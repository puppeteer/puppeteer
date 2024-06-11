# Running Puppeteer in the browser

Puppeteer is a powerful tool for automating browsers, but did you know it can also run within a browser itself? This enables you to leverage Puppeteer's capabilities for tasks that don't require Node.js specific features.

## Supported Features

While running in the browser, Puppeteer offers a variety of functionalities including:

1. WebSocket Connections: Establish connections to existing browser instances using WebSockets. Launching or downloading browsers directly is not supported as it relies on Node.js APIs.
2. Script Evaluation: Execute JavaScript code within the browser context.
3. Document Manipulation: Generate PDFs and screenshots of the current web page.
4. Page Management: Create, close, and navigate between different web pages.
5. Cookie Handling: Inspect, modify, and manage cookies within the browser.
6. Network Control: Monitor and intercept network requests made by the browser.

## How to run Puppeteer in the browser

:::note

See https://github.com/puppeteer/puppeteer/tree/main/examples/puppeteer-in-browser for a complete example.

:::

To run Puppeteer in the browser, first you need to produce a browser-compatible build using a bundler such as rollup or webpack:

1. When importing Puppeteer use the browser-specific entrypoint from puppeteer-core `puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js'`:

```ts
import puppeteer from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';

const browser = await puppeteer.connect({
  browserWSEndpoint: wsUrl,
});

alert('Browser has ' + (await browser.pages()).length + ' pages');

browser.disconnect();
```

2. Build your app using a bundler. For example, the following configuration can be used with rollup:

```js
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'main.mjs',
  output: {
    format: 'esm',
    dir: 'out',
  },
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

:::note

Do not forget to include a valid browser WebSocket endpoint when connecting to an instance.

:::

3. Include the produced bundle into a web page.
