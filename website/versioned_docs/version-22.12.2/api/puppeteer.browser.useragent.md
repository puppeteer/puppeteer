---
sidebar_label: Browser.userAgent
---

# Browser.userAgent() method

Gets this [browser's](./puppeteer.browser.md) original user agent.

[Pages](./puppeteer.page.md) can override the user agent with [Page.setUserAgent()](./puppeteer.page.setuseragent.md).

#### Signature:

```typescript
class Browser {
  abstract userAgent(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;
