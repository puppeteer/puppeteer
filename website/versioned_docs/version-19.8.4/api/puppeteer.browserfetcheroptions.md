---
sidebar_label: BrowserFetcherOptions
---

# BrowserFetcherOptions interface

#### Signature:

```typescript
export interface BrowserFetcherOptions
```

## Properties

| Property          | Modifiers             | Type                                | Description                                                                          | Default                                                                                                                          |
| ----------------- | --------------------- | ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| host              | <code>optional</code> | string                              | Determines the host that will be used for downloading.                               | <p>Either</p><p>- https://storage.googleapis.com or - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central</p> |
| path              |                       | string                              | Determines the path to download browsers to.                                         |                                                                                                                                  |
| platform          | <code>optional</code> | [Platform](./puppeteer.platform.md) | Determines which platform the browser will be suited for.                            | **Auto-detected.**                                                                                                               |
| product           | <code>optional</code> | 'chrome' \| 'firefox'               | Determines which product the [BrowserFetcher](./puppeteer.browserfetcher.md) is for. | <code>chrome</code>                                                                                                              |
| useMacOSARMBinary | <code>optional</code> | boolean                             | Enables the use of the Chromium binary for macOS ARM.                                |                                                                                                                                  |
