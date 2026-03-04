---
sidebar_label: Browser.version
---

# Browser.version() method

Gets a string representing this [browser's](./puppeteer.browser.md) name and version.

For headless browser, this is similar to `"HeadlessChrome/61.0.3153.0"`. For non-headless or new-headless, this is similar to `"Chrome/61.0.3153.0"`. For Firefox, it is similar to `"Firefox/116.0a1"`.

The format of [Browser.version()](./puppeteer.browser.version.md) might change with future releases of browsers.

### Signature

```typescript
class Browser {
  abstract version(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;
