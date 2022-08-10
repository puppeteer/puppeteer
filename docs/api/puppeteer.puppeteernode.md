---
sidebar_label: PuppeteerNode
---

# PuppeteerNode class

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

**Signature:**

```typescript
export declare class PuppeteerNode extends Puppeteer
```

**Extends:** [Puppeteer](./puppeteer.puppeteer.md)

## Remarks

The most common method to use is [launch](./puppeteer.puppeteernode.launch.md), which is used to launch and connect to a new browser instance.

See [the main Puppeteer class](./puppeteer.puppeteer.md) for methods common to all environments, such as [Puppeteer.connect()](./puppeteer.puppeteer.connect.md).

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `PuppeteerNode` class.

## Example

The following is a typical example of using Puppeteer to drive automation:

```ts
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```

Once you have created a `page` you have access to a large API to interact with the page, navigate, or find certain elements in that page. The [\`page\` documentation](./puppeteer.page.md) lists all the available methods.

## Properties

| Property                                                               | Modifiers             | Type   | Description                                                                                                            |
| ---------------------------------------------------------------------- | --------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| [\_preferredRevision](./puppeteer.puppeteernode._preferredrevision.md) |                       | string |                                                                                                                        |
| [product](./puppeteer.puppeteernode.product.md)                        | <code>readonly</code> | string | The name of the browser that is under automation (<code>&quot;chrome&quot;</code> or <code>&quot;firefox&quot;</code>) |

## Methods

| Method                                                                             | Modifiers | Description                                                                                         |
| ---------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| [connect(options)](./puppeteer.puppeteernode.connect.md)                           |           | This method attaches Puppeteer to an existing browser instance.                                     |
| [createBrowserFetcher(options)](./puppeteer.puppeteernode.createbrowserfetcher.md) |           |                                                                                                     |
| [defaultArgs(options)](./puppeteer.puppeteernode.defaultargs.md)                   |           |                                                                                                     |
| [executablePath(channel)](./puppeteer.puppeteernode.executablepath.md)             |           |                                                                                                     |
| [launch(options)](./puppeteer.puppeteernode.launch.md)                             |           | Launches puppeteer and launches a browser instance with given arguments and options when specified. |
