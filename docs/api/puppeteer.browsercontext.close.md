---
sidebar_label: BrowserContext.close
---

# BrowserContext.close() method

### Signature:

```typescript
class BrowserContext {
  abstract close(): Promise<void>;
}
```

Closes this [browser context](./puppeteer.browsercontext.md) and all associated [pages](./puppeteer.page.md).

**Returns:**

Promise&lt;void&gt;

## Remarks

The [default browser context](./puppeteer.browser.defaultbrowsercontext.md) cannot be closed.
