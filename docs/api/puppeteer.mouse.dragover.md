---
sidebar_label: Mouse.dragOver
---

# Mouse.dragOver() method

Dispatches a `dragover` event.

#### Signature:

```typescript
class Mouse &#123;abstract dragOver(target: Point, data: Protocol.Input.DragData): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                          | Description                                    |
| --------- | ----------------------------- | ---------------------------------------------- |
| target    | [Point](./puppeteer.point.md) | point for emitting <code>dragover</code> event |
| data      | Protocol.Input.DragData       | drag data containing items and operations mask |

**Returns:**

Promise&lt;void&gt;
