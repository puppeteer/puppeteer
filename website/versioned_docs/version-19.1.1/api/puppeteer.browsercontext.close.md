---
sidebar_label: BrowserContext.close
---

# BrowserContext.close() method

Closes the browser context. All the targets that belong to the browser context will be closed.

#### Signature:

```typescript
class BrowserContext {
  close(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

Only incognito browser contexts can be closed.
