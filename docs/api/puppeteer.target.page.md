---
sidebar_label: Target.page
---

# Target.page() method

### Signature:

```typescript
class Target {
  page(): Promise<Page | null>;
}
```

If the target is not of type `"page"`, `"webview"` or `"background_page"`, returns `null`.

**Returns:**

Promise&lt;[Page](./puppeteer.page.md) \| null&gt;
