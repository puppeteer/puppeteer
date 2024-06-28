---
sidebar_label: BrowserContext.pages
---

# BrowserContext.pages() method

### Signature:

```typescript
class BrowserContext {
  abstract pages(): Promise<Page[]>;
}
```

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

## Remarks

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).
