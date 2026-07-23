---
sidebar_label: Realm.extension
---

# Realm.extension() method

Returns the [Extension](./puppeteer.extension.md) that created this realm, if applicable. This is typically populated when the realm was created by an extension content script injected into a page.

### Signature

```typescript
class Realm {
  abstract extension(): Promise<Extension | null>;
}
```

**Returns:**

Promise&lt;[Extension](./puppeteer.extension.md) \| null&gt;

A promise that resolves to the [Extension](./puppeteer.extension.md) or `null` if not created by an extension.
