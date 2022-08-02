---
sidebar_label: BrowserFetcher.localRevisions
---

# BrowserFetcher.localRevisions() method

**Signature:**

```typescript
class BrowserFetcher {
  localRevisions(): Promise<string[]>;
}
```

**Returns:**

Promise&lt;string\[\]&gt;

A promise with a list of all revision strings (for the current `product`) available locally on disk.

## Remarks

This method is affected by the current `product`.
