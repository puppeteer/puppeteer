---
sidebar_label: Page.openDevTools
---

# Page.openDevTools() method

Opens DevTools for the this page if not already open and returns the DevTools page. This method is only available in Chrome.

### Signature

```typescript
class Page {
  abstract openDevTools(): Promise<Page>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;
