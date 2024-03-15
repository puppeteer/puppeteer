---
sidebar_label: InstallOptions
---

# InstallOptions interface

#### Signature:

```typescript
export interface InstallOptions
```

## Properties

| Property                 | Modifiers             | Type                                                     | Description                                                                                                                                       | Default                                                                                                                                                    |
| ------------------------ | --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| baseUrl                  | <code>optional</code> | string                                                   | Determines the host that will be used for downloading.                                                                                            | <p>Either</p><p>- https://storage.googleapis.com/chrome-for-testing-public or - https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central</p> |
| browser                  |                       | [Browser](./browsers.browser.md)                         | Determines which browser to install.                                                                                                              |                                                                                                                                                            |
| buildId                  |                       | string                                                   | Determines which buildId to download. BuildId should uniquely identify binaries and they are used for caching.                                    |                                                                                                                                                            |
| buildIdAlias             | <code>optional</code> | string                                                   | An alias for the provided <code>buildId</code>. It will be used to maintain local metadata to support aliases in the <code>launch</code> command. |                                                                                                                                                            |
| cacheDir                 |                       | string                                                   | Determines the path to download browsers to.                                                                                                      |                                                                                                                                                            |
| downloadProgressCallback | <code>optional</code> | (downloadedBytes: number, totalBytes: number) =&gt; void | Provides information about the progress of the download.                                                                                          |                                                                                                                                                            |
| platform                 | <code>optional</code> | [BrowserPlatform](./browsers.browserplatform.md)         | Determines which platform the browser will be suited for.                                                                                         | **Auto-detected.**                                                                                                                                         |
| unpack                   | <code>optional</code> | boolean                                                  | Whether to unpack and install browser archives.                                                                                                   | <code>true</code>                                                                                                                                          |
