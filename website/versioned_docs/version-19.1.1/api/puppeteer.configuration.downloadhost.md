---
sidebar_label: Configuration.downloadHost
---

# Configuration.downloadHost property

Specifies the URL prefix that is used to download Chromium.

Can be overridden by `PUPPETEER_DOWNLOAD_HOST`.

#### Signature:

```typescript
interface Configuration {
  downloadHost?: string;
}
```

#### Default value:

Either https://storage.googleapis.com or https://archive.mozilla.org/pub/firefox/nightly/latest-mozilla-central, depending on the product.

## Remarks

This must include the protocol and may even need a path prefix.
