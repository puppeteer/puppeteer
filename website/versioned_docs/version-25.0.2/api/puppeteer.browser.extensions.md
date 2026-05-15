---
sidebar_label: Browser.extensions
---

# Browser.extensions() method

Retrieves a map of all extensions installed in the browser, where the keys are extension IDs and the values are the corresponding [Extension](./puppeteer.extension.md) instances.

### Signature

```typescript
class Browser {
  abstract extensions(): Promise<Map<string, Extension>>;
}
```

**Returns:**

Promise&lt;Map&lt;string, [Extension](./puppeteer.extension.md)&gt;&gt;
