---
sidebar_label: Browser.version
---

# Browser.version() method

A string representing the browser name and version.

#### Signature:

```typescript
class Browser {
  version(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;

## Remarks

For headless Chromium, this is similar to `HeadlessChrome/61.0.3153.0`. For non-headless, this is similar to `Chrome/61.0.3153.0`.

The format of browser.version() might change with future releases of Chromium.
