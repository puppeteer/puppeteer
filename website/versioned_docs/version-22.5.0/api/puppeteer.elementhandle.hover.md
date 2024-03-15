---
sidebar_label: ElementHandle.hover
---

# ElementHandle.hover() method

This method scrolls element into view if needed, and then uses [Page](./puppeteer.page.md) to hover over the center of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle {
  hover(this: ElementHandle<Element>): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                         | Description |
| --------- | ------------------------------------------------------------ | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |

**Returns:**

Promise&lt;void&gt;
