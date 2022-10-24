---
sidebar_label: BrowserContext.pages
---

# BrowserContext.pages() method

An array of all pages inside the browser context.

#### Signature:

```typescript
class BrowserContext {
  pages(): Promise<Page[]>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

Promise which resolves to an array of all open pages. Non visible pages, such as `"background_page"`, will not be listed here. You can find them using [the target page](./puppeteer.target.page.md).
