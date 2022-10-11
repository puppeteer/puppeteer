---
sidebar_label: PuppeteerNode.createBrowserFetcher
---

# PuppeteerNode.createBrowserFetcher() method

> Warning: This API is now obsolete.
>
> Import [BrowserFetcher](./puppeteer.browserfetcher.md) directly and use the constructor.

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
