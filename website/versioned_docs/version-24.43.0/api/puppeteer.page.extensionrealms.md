---
sidebar_label: Page.extensionRealms
---

# Page.extensionRealms() method

Retrieves the list of extension execution realms in the main frame of the page. These realms correspond to extension content scripts running on the page.

Shortcut for [mainFrame().extensionRealms()](./puppeteer.frame.extensionrealms.md).

### Signature

```typescript
class Page {
  abstract extensionRealms(): Realm[];
}
```

**Returns:**

[Realm](./puppeteer.realm.md)\[\]
