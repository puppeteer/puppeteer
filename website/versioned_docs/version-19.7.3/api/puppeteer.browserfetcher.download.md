---
sidebar_label: BrowserFetcher.download
---

# BrowserFetcher.download() method

Initiates a GET request to download the revision from the host.

#### Signature:

```typescript
class BrowserFetcher {
  download(
    revision: string,
    progressCallback?: (x: number, y: number) => void
  ): Promise<BrowserFetcherRevisionInfo | undefined>;
}
```

## Parameters

| Parameter        | Type                              | Description                                                                                                                                        |
| ---------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| revision         | string                            | The revision to download.                                                                                                                          |
| progressCallback | (x: number, y: number) =&gt; void | _(Optional)_ A function that will be called with two arguments: How many bytes have been downloaded and the total number of bytes of the download. |

**Returns:**

Promise&lt;[BrowserFetcherRevisionInfo](./puppeteer.browserfetcherrevisioninfo.md) \| undefined&gt;

A promise with revision information when the revision is downloaded and extracted.

## Remarks

This method is affected by the current `product`.
