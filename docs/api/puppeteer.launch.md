---
sidebar_label: launch
---

# launch() function

#### Signature:

```typescript
launch: (
  options?:
    | import('puppeteer-core/internal/puppeteer-core.js').PuppeteerLaunchOptions
    | undefined
) => Promise<import('puppeteer-core/internal/puppeteer-core.js').Browser>;
```

## Parameters

| Parameter | Type                                                                                                                             | Description  |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| options   | import("puppeteer-core/internal/puppeteer-core.js").[PuppeteerLaunchOptions](./puppeteer.puppeteerlaunchoptions.md) \| undefined | _(Optional)_ |

**Returns:**

Promise&lt;import("puppeteer-core/internal/puppeteer-core.js").[Browser](./puppeteer.browser.md)&gt;
