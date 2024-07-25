---
sidebar_label: BrowserContext.close
---

# BrowserContext.close() method

Closes this [browser context](./puppeteer.browsercontext.md) and all associated [pages](./puppeteer.page.md).

#### Signature:

```typescript
class BrowserContext {
  abstract close(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

The [default browser context](./puppeteer.browser.defaultbrowsercontext.md) cannot be closed.
