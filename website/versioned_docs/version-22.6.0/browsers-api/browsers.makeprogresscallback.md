---
sidebar_label: makeProgressCallback
---

# makeProgressCallback() function

#### Signature:

```typescript
export declare function makeProgressCallback(
  browser: Browser,
  buildId: string
): (downloadedBytes: number, totalBytes: number) => void;
```

## Parameters

| Parameter | Type                             | Description |
| --------- | -------------------------------- | ----------- |
| browser   | [Browser](./browsers.browser.md) |             |
| buildId   | string                           |             |

**Returns:**

(downloadedBytes: number, totalBytes: number) =&gt; void
