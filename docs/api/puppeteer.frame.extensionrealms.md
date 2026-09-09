---
sidebar_label: Frame.extensionRealms
---

# Frame.extensionRealms() method

Retrieves the list of extension execution realms associated with this frame. Extension execution realms are created by extension content scripts injected into the frame.

### Signature

```typescript
class Frame {
  abstract extensionRealms(): Realm[];
}
```

**Returns:**

[Realm](./puppeteer.realm.md)\[\]
