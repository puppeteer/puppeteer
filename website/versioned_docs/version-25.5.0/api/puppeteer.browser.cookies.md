---
sidebar_label: Browser.cookies
---

# Browser.cookies() method

Returns all cookies in the default [BrowserContext](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  cookies(): Promise<Cookie[]>;
}
```

**Returns:**

Promise&lt;[Cookie](./puppeteer.cookie.md)\[\]&gt;

## Remarks

Shortcut for [browser.defaultBrowserContext().cookies()](./puppeteer.browsercontext.cookies.md).
