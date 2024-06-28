---
sidebar_label: Browser.pages
---

# Browser.pages() method

### Signature:

```typescript
class Browser {
  pages(): Promise<Page[]>;
}
```

Gets a list of all open [pages](./puppeteer.page.md) inside this [Browser](./puppeteer.browser.md).

If there ar multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [pages](./puppeteer.page.md) in all [browser contexts](./puppeteer.browsercontext.md).

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

## Remarks

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).
