---
sidebar_label: PuppeteerNode.defaultBrowser
---

# PuppeteerNode.defaultBrowser() method

The name of the browser that will be launched by default. For `puppeteer`, this is influenced by your configuration. Otherwise, it's `chrome`.

### Signature

```typescript
class PuppeteerNode {
  defaultBrowser(): Promise<SupportedBrowser>;
}
```

**Returns:**

Promise&lt;[SupportedBrowser](./puppeteer.supportedbrowser.md)&gt;
