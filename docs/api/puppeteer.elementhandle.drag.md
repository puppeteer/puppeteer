---
sidebar_label: ElementHandle.drag
---

# ElementHandle.drag() method

Drags an element to the given element or point.

#### Signature:

```typescript
class ElementHandle {
  drag(
    this: ElementHandle<Element>,
    target: Point | ElementHandle<Element>
  ): Promise<Protocol.Input.DragData | void>;
}
```

## Parameters

| Parameter | Type                                                                                          | Description |
| --------- | --------------------------------------------------------------------------------------------- | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;                                  |             |
| target    | [Point](./puppeteer.point.md) \| [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |

**Returns:**

Promise&lt;Protocol.Input.DragData \| void&gt;

DEPRECATED. When drag interception is enabled, the drag payload is returned.
