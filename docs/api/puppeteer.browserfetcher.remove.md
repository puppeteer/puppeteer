---
sidebar_label: BrowserFetcher.remove
---

# BrowserFetcher.remove() method

#### Signature:

```typescript
class BrowserFetcher {
  remove(revision: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                |
| --------- | ------ | ---------------------------------------------------------- |
| revision  | string | A revision to remove for the current <code>product</code>. |

**Returns:**

Promise&lt;void&gt;

A promise that resolves when the revision has been removed or throws if the revision has not been downloaded.

## Remarks

This method is affected by the current `product`.
