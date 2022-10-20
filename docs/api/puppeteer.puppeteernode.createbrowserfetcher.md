---
sidebar_label: PuppeteerNode.createBrowserFetcher
---

# PuppeteerNode.createBrowserFetcher() method

> Warning: This API is now obsolete.
>
> If you are using `puppeteer-core`, do not use this method. Just construct [BrowserFetcher](./puppeteer.browserfetcher.md) manually.

**Signature:**

```typescript
class PuppeteerNode {
  createBrowserFetcher(options: BrowserFetcherOptions): BrowserFetcher;
}
```

## Parameters

| Parameter | Type                                                          | Description                                                                |
| --------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| options   | [BrowserFetcherOptions](./puppeteer.browserfetcheroptions.md) | Set of configurable options to specify the settings of the BrowserFetcher. |

**Returns:**

[BrowserFetcher](./puppeteer.browserfetcher.md)

A new BrowserFetcher instance.
