---
sidebar_label: BrowserFetcherOptions
---

# BrowserFetcherOptions interface

#### Signature:

```typescript
export interface BrowserFetcherOptions
```

## Properties

| Property                                                                     | Modifiers | Type                                | Description                                                                                            | Default                                                                                                                          |
| ---------------------------------------------------------------------------- | --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| [host?](./puppeteer.browserfetcheroptions.host.md)                           |           | string                              | <i>(Optional)</i> Determines the host that will be used for downloading.                               | <p>Either</p><p>- https://storage.googleapis.com or - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central</p> |
| [path](./puppeteer.browserfetcheroptions.path.md)                            |           | string                              | Determines the path to download browsers to.                                                           |                                                                                                                                  |
| [platform?](./puppeteer.browserfetcheroptions.platform.md)                   |           | [Platform](./puppeteer.platform.md) | <i>(Optional)</i> Determines which platform the browser will be suited for.                            | Auto-detected.                                                                                                                   |
| [product?](./puppeteer.browserfetcheroptions.product.md)                     |           | 'chrome' \| 'firefox'               | <i>(Optional)</i> Determines which product the [BrowserFetcher](./puppeteer.browserfetcher.md) is for. | <code>&quot;chrome&quot;</code>.                                                                                                 |
| [useMacOSARMBinary?](./puppeteer.browserfetcheroptions.usemacosarmbinary.md) |           | boolean                             | <i>(Optional)</i> Enables the use of the Chromium binary for macOS ARM.                                |                                                                                                                                  |
