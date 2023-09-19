---
sidebar_label: ElementHandle.dragAndDrop
---

# ElementHandle.dragAndDrop() method

> Warning: This API is now obsolete.
>
> Use `ElementHandle.drop` instead.

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
