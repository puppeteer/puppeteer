---
sidebar_label: ElementHandle.drag
---

# ElementHandle.drag() method

This method creates and captures a dragevent from the element.

#### Signature:

```typescript
class ElementHandle {
  drag(
    this: ElementHandle<Element>,
    target: Point
  ): Promise<Protocol.Input.DragData>;
}
```

## Parameters

| Parameter | Type                                                         | Description |
| --------- | ------------------------------------------------------------ | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |
| target    | [Point](./puppeteer.point.md)                                |             |

**Returns:**

Promise&lt;Protocol.Input.DragData&gt;
