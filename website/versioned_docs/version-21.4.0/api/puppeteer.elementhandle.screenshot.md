---
sidebar_label: ElementHandle.screenshot
---

# ElementHandle.screenshot() method

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot_1.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle {
  screenshot(
    this: ElementHandle<Element>,
    options?: Readonly<ElementScreenshotOptions>
  ): Promise<string | Buffer>;
}
```

## Parameters

| Parameter | Type                                                                                | Description  |
| --------- | ----------------------------------------------------------------------------------- | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;                        |              |
| options   | Readonly&lt;[ElementScreenshotOptions](./puppeteer.elementscreenshotoptions.md)&gt; | _(Optional)_ |

**Returns:**

Promise&lt;string \| Buffer&gt;
