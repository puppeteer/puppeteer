---
sidebar_label: Page.createCDPSession
---

# Page.createCDPSession() method

Creates a Chrome Devtools Protocol session attached to the page.

#### Signature:

```typescript
class Page {
  abstract createCDPSession(): Promise<CDPSession>;
}
```

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
