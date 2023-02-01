---
sidebar_label: ElementHandle.screenshot
---

# ElementHandle.screenshot() method

This method scrolls element into view if needed, and then uses to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle {
  screenshot(
    this: ElementHandle<Element>,
    options?: ScreenshotOptions
  ): Promise<string | Buffer>;
}
```

## Parameters

| Parameter | Type                                                         | Description       |
| --------- | ------------------------------------------------------------ | ----------------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |                   |
| options   | [ScreenshotOptions](./puppeteer.screenshotoptions.md)        | <i>(Optional)</i> |

**Returns:**

Promise&lt;string \| Buffer&gt;
