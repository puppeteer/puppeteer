---
sidebar_label: Browser.userAgent
---

# Browser.userAgent() method

The browser's original user agent. Pages can override the browser user agent with [Page.setUserAgent()](./puppeteer.page.setuseragent.md).

#### Signature:

```typescript
class Browser {
  userAgent(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;
