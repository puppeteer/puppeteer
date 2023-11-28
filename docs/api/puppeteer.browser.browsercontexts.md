---
sidebar_label: Browser.browserContexts
---

# Browser.browserContexts() method

Gets a list of open [browser contexts](./puppeteer.browsercontext.md).

In a newly-created [browser](./puppeteer.browser.md), this will return a single instance of [BrowserContext](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class Browser {
  abstract browserContexts(): BrowserContext[];
}
```

**Returns:**

[BrowserContext](./puppeteer.browsercontext.md)\[\]
