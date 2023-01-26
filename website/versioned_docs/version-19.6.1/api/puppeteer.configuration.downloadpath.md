---
sidebar_label: Configuration.downloadPath
---

# Configuration.downloadPath property

Specifies the path for the downloads folder.

Can be overridden by `PUPPETEER_DOWNLOAD_PATH`.

#### Signature:

```typescript
interface Configuration {
  downloadPath?: string;
}
```

#### Default value:

`<cache>/<product>` where `<cache>` is Puppeteer's cache directory and `<product>` is the name of the browser.
