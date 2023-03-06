---
sidebar_label: ElementHandle.dragOver
---

# ElementHandle.dragOver() method

This method creates a `dragover` event on the element.

#### Signature:

```typescript
class ElementHandle {
  dragOver(
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
