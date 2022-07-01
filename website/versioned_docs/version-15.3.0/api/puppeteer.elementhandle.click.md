---
sidebar_label: ElementHandle.click
---

# ElementHandle.click() method

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.mouse.md) to click in the center of the element. If the element is detached from DOM, the method throws an error.

**Signature:**

```typescript
class ElementHandle {
  click(options?: ClickOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                        | Description       |
| --------- | ------------------------------------------- | ----------------- |
| options   | [ClickOptions](./puppeteer.clickoptions.md) | <i>(Optional)</i> |

**Returns:**

Promise&lt;void&gt;
