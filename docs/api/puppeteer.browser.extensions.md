---
sidebar_label: Browser.extensions
---

# Browser.extensions() method

Get a list of the installed extensions in the browser.

### Signature

```typescript
class Browser {
  abstract extensions(): Promise<Extension[]>;
}
```

**Returns:**

Promise&lt;[Extension](./puppeteer.extension.md)\[\]&gt;
