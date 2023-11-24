---
sidebar_label: BrowserContext.pages
---

# BrowserContext.pages() method

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class BrowserContext &#123;abstract pages(): Promise<Page[]>;&#125;
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

## Remarks

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).
