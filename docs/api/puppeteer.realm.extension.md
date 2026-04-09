---
sidebar_label: Realm.extension
---

# Realm.extension() method

This method returns the extension that created this realm if the realm was created from an Extension. An example of this is an extension content script running on a page.

### Signature

```typescript
class Realm {
  abstract extension(): Promise<Extension | null>;
}
```

**Returns:**

Promise&lt;[Extension](./puppeteer.extension.md) \| null&gt;
