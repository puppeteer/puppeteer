---
sidebar_label: Mouse.drag
---

# Mouse.drag() method

Dispatches a `drag` event.

#### Signature:

```typescript
class Mouse {
  drag(start: Point, target: Point): Promise<Protocol.Input.DragData>;
}
```

## Parameters

| Parameter | Type                          | Description             |
| --------- | ----------------------------- | ----------------------- |
| start     | [Point](./puppeteer.point.md) | starting point for drag |
| target    | [Point](./puppeteer.point.md) | point to drag to        |

**Returns:**

Promise&lt;Protocol.Input.DragData&gt;
