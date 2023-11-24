---
sidebar_label: ElementHandle.screenshot
---

# ElementHandle.screenshot() method

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot_1.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle &#123;screenshot(options: Readonly<ScreenshotOptions> & &#123;
        encoding: 'base64';
    &#125;): Promise<string>;&#125;
```

## Parameters

| Parameter | Type                                                                                                          | Description |
| --------- | ------------------------------------------------------------------------------------------------------------- | ----------- |
| options   | Readonly&lt;[ScreenshotOptions](./puppeteer.screenshotoptions.md)&gt; &amp; &#123; encoding: 'base64'; &#125; |             |

**Returns:**

Promise&lt;string&gt;
