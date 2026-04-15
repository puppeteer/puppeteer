---
sidebar_label: Page.openDevTools
---

# Page.openDevTools() method

Opens DevTools for the current Page and returns the DevTools Page. This method is only available in Chrome.

### Signature

```typescript
class Page {
  abstract openDevTools(): Promise<Page>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;
