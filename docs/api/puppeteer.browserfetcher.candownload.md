---
sidebar_label: BrowserFetcher.canDownload
---

# BrowserFetcher.canDownload() method

Initiates a HEAD request to check if the revision is available.

#### Signature:

```typescript
class BrowserFetcher {
  canDownload(revision: string): Promise<boolean>;
}
```

## Parameters

| Parameter | Type   | Description                             |
| --------- | ------ | --------------------------------------- |
| revision  | string | The revision to check availability for. |

**Returns:**

Promise&lt;boolean&gt;

A promise that resolves to `true` if the revision could be downloaded from the host.

## Remarks

This method is affected by the current `product`.
