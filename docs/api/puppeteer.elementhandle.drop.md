---
sidebar_label: ElementHandle.drop
---

# ElementHandle.drop() method

Drops the given element onto the current one.

#### Signature:

```typescript
class ElementHandle {
  drop(
    this: ElementHandle<Element>,
    element: ElementHandle<Element>
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                         | Description |
| --------- | ------------------------------------------------------------ | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |
| element   | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |             |

**Returns:**

Promise&lt;void&gt;
