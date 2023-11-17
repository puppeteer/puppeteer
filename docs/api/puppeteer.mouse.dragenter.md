---
sidebar_label: Mouse.dragEnter
---

# Mouse.dragEnter() method

Dispatches a `dragenter` event.

#### Signature:

```typescript
class Mouse {
  abstract dragEnter(
    target: Point,
    data: Protocol.Input.DragData
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                          | Description                                     |
| --------- | ----------------------------- | ----------------------------------------------- |
| target    | [Point](./puppeteer.point.md) | point for emitting <code>dragenter</code> event |
| data      | Protocol.Input.DragData       | drag data containing items and operations mask  |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
