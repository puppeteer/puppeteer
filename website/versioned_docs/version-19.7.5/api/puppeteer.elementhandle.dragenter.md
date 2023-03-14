---
sidebar_label: ElementHandle.dragEnter
---

# ElementHandle.dragEnter() method

This method creates a `dragenter` event on the element.

#### Signature:

```typescript
class ElementHandle {
  dragEnter(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                         | Description  |
| --------- | ------------------------------------------------------------ | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |              |
| data      | Protocol.Input.DragData                                      | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
