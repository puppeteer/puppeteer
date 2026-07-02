---
sidebar_label: Browser.createBrowserContext
---

# Browser.createBrowserContext() method

Creates a new [browser context](./puppeteer.browsercontext.md).

This won't share cookies/cache with other [browser contexts](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  abstract createBrowserContext(
    options?: BrowserContextOptions,
  ): Promise<BrowserContext>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

[BrowserContextOptions](./puppeteer.browsercontextoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[BrowserContext](./puppeteer.browsercontext.md)&gt;

## Example

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
// Create a new browser context.
const context = await browser.createBrowserContext();
// Create a new page in a pristine context.
const page = await context.newPage();
// Do stuff
await page.goto('https://example.com');
```
