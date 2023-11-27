---
sidebar_label: Browser.createIncognitoBrowserContext
---

# Browser.createIncognitoBrowserContext() method

Creates a new incognito [browser context](./puppeteer.browsercontext.md).

This won't share cookies/cache with other [browser contexts](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class Browser \{abstract createIncognitoBrowserContext(options?: BrowserContextOptions): Promise<BrowserContext>;\}
```

## Parameters

| Parameter | Type                                                          | Description  |
| --------- | ------------------------------------------------------------- | ------------ |
| options   | [BrowserContextOptions](./puppeteer.browsercontextoptions.md) | _(Optional)_ |

**Returns:**

Promise&lt;[BrowserContext](./puppeteer.browsercontext.md)&gt;

## Example

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
// Create a new incognito browser context.
const context = await browser.createIncognitoBrowserContext();
// Create a new page in a pristine context.
const page = await context.newPage();
// Do stuff
await page.goto('https://example.com');
```
