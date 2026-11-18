---
sidebar_label: Target.page
---

# Target.page() method

If the target is not of type `"page"`, `"webview"` or `"background_page"`, or if the target is [discarded](./puppeteer.target.isdiscarded.md), returns `null`.

### Signature

```typescript
class Target {
  page(): Promise<Page | null>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md) \| null&gt;
