---
sidebar_label: ElementHandle.dragAndDrop
---

# ElementHandle.dragAndDrop() method

This method triggers a dragenter, dragover, and drop on the element.

#### Signature:

```typescript
class ElementHandle {
  dragAndDrop(
    this: ElementHandle<Element>,
    target: ElementHandle<Node>,
    options?: {
      delay: number;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                         | Description  |
| --------- | ------------------------------------------------------------ | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |              |
| target    | [ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;    |              |
| options   | { delay: number; }                                           | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
