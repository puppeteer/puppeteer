---
sidebar_label: PuppeteerNode
---

# PuppeteerNode class

Extends the main [Puppeteer](./puppeteer.puppeteer.md) class with Node specific behaviour for fetching and downloading browsers.

If you're using Puppeteer in a Node environment, this is the class you'll get when you run `require('puppeteer')` (or the equivalent ES `import`).

#### Signature:

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
import puppeteer from 'puppeteer';

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

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

defaultProduct

</td><td>

`readonly`

</td><td>

[Product](./puppeteer.product.md)

</td><td>

The name of the browser that will be launched by default. For `puppeteer`, this is influenced by your configuration. Otherwise, it's `chrome`.

</td></tr>
<tr><td>

lastLaunchedProduct

</td><td>

`readonly`

</td><td>

[Product](./puppeteer.product.md)

</td><td>

The name of the browser that was last launched.

</td></tr>
<tr><td>

product

</td><td>

`readonly`

</td><td>

string

</td><td>

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[connect(options)](./puppeteer.puppeteernode.connect.md)

</td><td>

</td><td>

This method attaches Puppeteer to an existing browser instance.

</td></tr>
<tr><td>

[defaultArgs(options)](./puppeteer.puppeteernode.defaultargs.md)

</td><td>

</td><td>

</td></tr>
<tr><td>

[executablePath(channel)](./puppeteer.puppeteernode.executablepath.md)

</td><td>

</td><td>

The default executable path.

</td></tr>
<tr><td>

[launch(options)](./puppeteer.puppeteernode.launch.md)

</td><td>

</td><td>

Launches a browser instance with given arguments and options when specified.

When using with `puppeteer-core`, [options.executablePath](./puppeteer.launchoptions.md) or [options.channel](./puppeteer.launchoptions.md) must be provided.

</td></tr>
<tr><td>

[trimCache()](./puppeteer.puppeteernode.trimcache.md)

</td><td>

</td><td>

Removes all non-current Firefox and Chrome binaries in the cache directory identified by the provided Puppeteer configuration. The current browser version is determined by resolving PUPPETEER_REVISIONS from Puppeteer unless `configuration.browserRevision` is provided.

</td></tr>
</tbody></table>
