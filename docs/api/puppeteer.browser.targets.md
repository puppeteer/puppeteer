---
sidebar_label: Browser.targets
---

# Browser.targets() method

### Signature:

```typescript
class Browser {
  abstract targets(): Target[];
}
```

Gets all active [targets](./puppeteer.target.md).

In case of multiple [browser contexts](./puppeteer.browsercontext.md), this returns all [targets](./puppeteer.target.md) in all [browser contexts](./puppeteer.browsercontext.md).

**Returns:**

[Target](./puppeteer.target.md)\[\]
