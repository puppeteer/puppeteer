---
sidebar_label: PuppeteerNode.product
---

# PuppeteerNode.product() method

> Warning: This API is now obsolete.
>
> Do not use as this field as it does not take into account multiple browsers of different types. Use [defaultBrowser](./puppeteer.puppeteernode.defaultbrowser.md) or [lastLaunchedBrowser](./puppeteer.puppeteernode.lastlaunchedbrowser.md).

### Signature

```typescript
class PuppeteerNode {
  product(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;

The name of the browser that is under automation.
