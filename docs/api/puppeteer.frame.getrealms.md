---
sidebar_label: Frame.getRealms
---

# Frame.getRealms() method

This method retrieves the list of realms inside of a Frame returned as a pair-like \[key, Object\] list

### Signature

```typescript
class Frame {
  abstract getRealms(): Array<[string | symbol, Realm]>;
}
```

**Returns:**

Array&lt;\[string \| symbol, [Realm](./puppeteer.realm.md)\]&gt;
