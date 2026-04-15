---
sidebar_label: Browser.extensions
---

# Browser.extensions() method

Get a map with id as keys and extension as value of the installed extensions in the browser.

### Signature

```typescript
class Browser {
  abstract extensions(): Promise<Map<string, Extension>>;
}
```

**Returns:**

Promise&lt;Map&lt;string, [Extension](./puppeteer.extension.md)&gt;&gt;
