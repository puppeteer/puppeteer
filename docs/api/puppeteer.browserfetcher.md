---
sidebar_label: BrowserFetcher
---

# BrowserFetcher class

BrowserFetcher can download and manage different versions of Chromium and Firefox.

#### Signature:

```typescript
export declare class BrowserFetcher
```

## Remarks

BrowserFetcher is not designed to work concurrently with other instances of BrowserFetcher that share the same downloads directory.

## Example

An example of using BrowserFetcher to download a specific version of Chromium and running Puppeteer against it:

```ts
const browserFetcher = new BrowserFetcher({path: 'path/to/download/folder'});
const revisionInfo = await browserFetcher.download('533271');
const browser = await puppeteer.launch({
  executablePath: revisionInfo.executablePath,
});
```

## Constructors

| Constructor                                                           | Modifiers | Description                                         |
| --------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| [(constructor)(options)](./puppeteer.browserfetcher._constructor_.md) |           | Constructs a browser fetcher for the given options. |

## Methods

| Method                                                                         | Modifiers | Description                                                     |
| ------------------------------------------------------------------------------ | --------- | --------------------------------------------------------------- |
| [canDownload(revision)](./puppeteer.browserfetcher.candownload.md)             |           | Initiates a HEAD request to check if the revision is available. |
| [download(revision, progressCallback)](./puppeteer.browserfetcher.download.md) |           | Initiates a GET request to download the revision from the host. |
| [host()](./puppeteer.browserfetcher.host.md)                                   |           |                                                                 |
| [localRevisions()](./puppeteer.browserfetcher.localrevisions.md)               |           |                                                                 |
| [platform()](./puppeteer.browserfetcher.platform.md)                           |           |                                                                 |
| [product()](./puppeteer.browserfetcher.product.md)                             |           |                                                                 |
| [remove(revision)](./puppeteer.browserfetcher.remove.md)                       |           |                                                                 |
| [revisionInfo(revision)](./puppeteer.browserfetcher.revisioninfo.md)           |           |                                                                 |
