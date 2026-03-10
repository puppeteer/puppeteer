---
sidebar_label: BrowserContext.cookies
---

# BrowserContext.cookies() method

Gets all cookies in the browser context.

### Signature

```typescript
class BrowserContext {
  abstract cookies(): Promise<Cookie[]>;
}
```

**Returns:**

Promise&lt;[Cookie](./puppeteer.cookie.md)\[\]&gt;
