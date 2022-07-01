---
sidebar_label: ElementHandle.dragAndDrop
---

# ElementHandle.dragAndDrop() method

This method triggers a dragenter, dragover, and drop on the element.

**Signature:**

```typescript
class ElementHandle {
  dragAndDrop(
    target: ElementHandle,
    options?: {
      delay: number;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                          | Description       |
| --------- | --------------------------------------------- | ----------------- |
| target    | [ElementHandle](./puppeteer.elementhandle.md) |                   |
| options   | { delay: number; }                            | <i>(Optional)</i> |

**Returns:**

Promise&lt;void&gt;
