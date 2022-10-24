---
sidebar_label: Mouse.dragEnter
---

# Mouse.dragEnter() method

Dispatches a `dragenter` event.

#### Signature:

```typescript
class Mouse {
  dragEnter(target: Point, data: Protocol.Input.DragData): Promise<void>;
}
```

## Parameters

| Parameter | Type                          | Description                                     |
| --------- | ----------------------------- | ----------------------------------------------- |
| target    | [Point](./puppeteer.point.md) | point for emitting <code>dragenter</code> event |
| data      | Protocol.Input.DragData       | drag data containing items and operations mask  |

**Returns:**

Promise&lt;void&gt;
