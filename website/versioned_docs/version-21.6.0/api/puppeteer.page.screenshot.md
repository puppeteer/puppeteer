---
sidebar_label: Page.screenshot
---

# Page.screenshot() method

Captures a screenshot of this [page](./puppeteer.page.md).

#### Signature:

```typescript
class Page {
  screenshot(
    options: Readonly<ScreenshotOptions> & {
      encoding: 'base64';
    }
  ): Promise<string>;
}
```

## Parameters

| Parameter | Type                                                                                                          | Description                     |
| --------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| options   | Readonly&lt;[ScreenshotOptions](./puppeteer.screenshotoptions.md)&gt; &amp; &#123; encoding: 'base64'; &#125; | Configures screenshot behavior. |

**Returns:**

Promise&lt;string&gt;
