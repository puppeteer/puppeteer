---
sidebar_label: Browser.targets
---

# Browser.targets() method

Gets all active [targets](./puppeteer.target.md).

In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  abstract targets(): Target[];
}
```

**Returns:**

[Target](./puppeteer.target.md)\[\]
