---
sidebar_label: Realm.extension
---

# Realm.extension() method

This method returns the extension from the ExecutionContext paired with the realm at the moment of the execution.

### Signature

```typescript
class Realm {
  abstract extension(): Promise<Extension | null>;
}
```

**Returns:**

Promise&lt;[Extension](./puppeteer.extension.md) \| null&gt;
