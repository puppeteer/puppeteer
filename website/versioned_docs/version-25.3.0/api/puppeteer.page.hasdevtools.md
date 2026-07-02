---
sidebar_label: Page.hasDevTools
---

# Page.hasDevTools() method

Returns true if DevTools is attached to the current page. Use [Page.openDevTools()](./puppeteer.page.opendevtools.md) to get the DevTools page.

### Signature

```typescript
class Page {
  abstract hasDevTools(): Promise<boolean>;
}
```

**Returns:**

Promise&lt;boolean&gt;
