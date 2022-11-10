---
sidebar_label: Browser.disconnect
---

# Browser.disconnect() method

Disconnects Puppeteer from the browser, but leaves the Chromium process running. After calling `disconnect`, the [Browser](./puppeteer.browser.md) object is considered disposed and cannot be used anymore.

#### Signature:

```typescript
class Browser {
  disconnect(): void;
}
```

**Returns:**

void
