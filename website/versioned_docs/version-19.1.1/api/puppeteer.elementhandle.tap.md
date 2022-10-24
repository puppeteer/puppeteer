---
sidebar_label: ElementHandle.tap
---

# ElementHandle.tap() method

This method scrolls element into view if needed, and then uses [Touchscreen.tap()](./puppeteer.touchscreen.tap.md) to tap in the center of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle {
  tap(this: ElementHandle<Element>): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                         | Description |
| --------- | ------------------------------------------------------------ | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |

**Returns:**

Promise&lt;void&gt;
