---
sidebar_label: Extension.pages
---

# Extension.pages() method

Returns a list of the currently active and visible pages belonging to the extension.

### Signature

```typescript
class Extension {
  abstract pages(): Promise<Page[]>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;
