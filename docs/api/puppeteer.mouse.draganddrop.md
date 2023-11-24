---
sidebar_label: Mouse.dragAndDrop
---

# Mouse.dragAndDrop() method

Performs a drag, dragenter, dragover, and drop in sequence.

#### Signature:

```typescript
class Mouse &#123;abstract dragAndDrop(start: Point, target: Point, options?: &#123;
        delay?: number;
    &#125;): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                          | Description                                                                                                                                                                   |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| start     | [Point](./puppeteer.point.md) | point to drag from                                                                                                                                                            |
| target    | [Point](./puppeteer.point.md) | point to drop on                                                                                                                                                              |
| options   | &#123; delay?: number; &#125; | _(Optional)_ An object of options. Accepts delay which, if specified, is the time to wait between <code>dragover</code> and <code>drop</code> in milliseconds. Defaults to 0. |

**Returns:**

Promise&lt;void&gt;
