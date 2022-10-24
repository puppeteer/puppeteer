---
sidebar_label: Mouse.drop
---

# Mouse.drop() method

Performs a dragenter, dragover, and drop in sequence.

#### Signature:

```typescript
class Mouse {
  drop(target: Point, data: Protocol.Input.DragData): Promise<void>;
}
```

## Parameters

| Parameter | Type                          | Description                                    |
| --------- | ----------------------------- | ---------------------------------------------- |
| target    | [Point](./puppeteer.point.md) | point to drop on                               |
| data      | Protocol.Input.DragData       | drag data containing items and operations mask |

**Returns:**

Promise&lt;void&gt;
