---
sidebar_label: PuppeteerNode.defaultArgs
---

# PuppeteerNode.defaultArgs() method

#### Signature:

```typescript
class PuppeteerNode {
  defaultArgs(options?: BrowserLaunchArgumentOptions): string[];
}
```

## Parameters

| Parameter | Type                                                                        | Description                                                     |
| --------- | --------------------------------------------------------------------------- | --------------------------------------------------------------- |
| options   | [BrowserLaunchArgumentOptions](./puppeteer.browserlaunchargumentoptions.md) | _(Optional)_ Set of configurable options to set on the browser. |

**Returns:**

string\[\]

The default flags that Chromium will be launched with.
