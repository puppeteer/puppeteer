---
sidebar_label: Page.extensionRealms
---

# Page.extensionRealms() method

This method retrieves the list of realms inside the main frame of a page.

Shortcut for `mainFrame().extensionRealms()`.

### Signature

```typescript
class Page {
  abstract extensionRealms(): Realm[];
}
```

**Returns:**

[Realm](./puppeteer.realm.md)\[\]
