---
sidebar_label: PuppeteerNode.createBrowserFetcher
---

# PuppeteerNode.createBrowserFetcher() method

#### Signature:

```typescript
class PuppeteerNode {
  createBrowserFetcher(
    options?: Partial<BrowserFetcherOptions>
  ): BrowserFetcher;
}
```

## Parameters

| Parameter | Type                                                                         | Description                                                                                  |
| --------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| options   | Partial&lt;[BrowserFetcherOptions](./puppeteer.browserfetcheroptions.md)&gt; | <i>(Optional)</i> Set of configurable options to specify the settings of the BrowserFetcher. |

**Returns:**

[BrowserFetcher](./puppeteer.browserfetcher.md)

A new BrowserFetcher instance.

## Remarks

If you are using `puppeteer-core`, do not use this method. Just construct [BrowserFetcher](./puppeteer.browserfetcher.md) manually.
