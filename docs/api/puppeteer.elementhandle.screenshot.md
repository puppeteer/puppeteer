---
sidebar_label: ElementHandle.screenshot
---

# ElementHandle.screenshot() method

This method scrolls element into view if needed, and then uses [Page.screenshot()](./puppeteer.page.screenshot.md) to take a screenshot of the element. If the element is detached from DOM, the method throws an error.

**Signature:**

```typescript
class ElementHandle {
  screenshot(options?: ScreenshotOptions): Promise<string | Buffer>;
}
```

## Parameters

| Parameter | Type                                                  | Description       |
| --------- | ----------------------------------------------------- | ----------------- |
| options   | [ScreenshotOptions](./puppeteer.screenshotoptions.md) | <i>(Optional)</i> |

**Returns:**

Promise&lt;string \| Buffer&gt;
