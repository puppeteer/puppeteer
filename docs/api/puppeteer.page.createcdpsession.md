---
sidebar_label: Page.createCDPSession
---

# Page.createCDPSession() method

### Signature:

```typescript
class Page {
  abstract createCDPSession(): Promise<CDPSession>;
}
```

Creates a Chrome Devtools Protocol session attached to the page.

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;
