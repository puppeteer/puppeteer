---
sidebar_label: Browser.disconnect
---

# Browser.disconnect() method

### Signature:

```typescript
class Browser {
  abstract disconnect(): Promise<void>;
}
```

Disconnects Puppeteer from this [browser](./puppeteer.browser.md), but leaves the process running.

**Returns:**

Promise&lt;void&gt;
