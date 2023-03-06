---
sidebar_label: ElementHandle.drop
---

# ElementHandle.drop() method

This method triggers a drop on the element.

#### Signature:

```typescript
class ElementHandle {
  drop(
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
