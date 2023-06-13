---
sidebar_label: Mouse.dragAndDrop
---

# Mouse.dragAndDrop() method

Performs a drag, dragenter, dragover, and drop in sequence.

#### Signature:

```typescript
class Mouse {
  dragAndDrop(
    start: Point,
    target: Point,
    options?: {
      delay?: number;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                          | Description                                                                                                                                                                   |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| start     | [Point](./puppeteer.point.md) | point to drag from                                                                                                                                                            |
| target    | [Point](./puppeteer.point.md) | point to drop on                                                                                                                                                              |
| options   | { delay?: number; }           | _(Optional)_ An object of options. Accepts delay which, if specified, is the time to wait between <code>dragover</code> and <code>drop</code> in milliseconds. Defaults to 0. |

**Returns:**

Promise&lt;void&gt;
