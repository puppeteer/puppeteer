---
sidebar_label: Browser.close
---

# Browser.close() method

Closes Chromium and all of its pages (if any were opened). The [Browser](./puppeteer.browser.md) object itself is considered to be disposed and cannot be used anymore.

#### Signature:

```typescript
class Browser {
  close(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;
