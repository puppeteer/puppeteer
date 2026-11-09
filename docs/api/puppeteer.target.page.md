---
sidebar_label: Target.page
---

# Target.page() method

Returns the [Page](./puppeteer.page.md) of the target, or `null` if the target has no page.

### Signature

```typescript
class Target {
  page(): Promise<Page | null>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md) \| null&gt;

## Remarks

- A `"tab"` target and its primary `"page"` target return the same [Page](./puppeteer.page.md). - A target with the `"prerender"` [subtype](./puppeteer.target.subtype.md) returns `null`. After Chrome activates the prerendered page, the target returns the [Page](./puppeteer.page.md) of the tab. - Targets that are not of type `"page"`, `"tab"`, `"webview"` or `"background_page"` return `null`.
