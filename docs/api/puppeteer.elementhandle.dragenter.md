---
sidebar_label: ElementHandle.dragEnter
---

# ElementHandle.dragEnter() method

This method creates a `dragenter` event on the element.

**Signature:**

```typescript
class ElementHandle {
  dragEnter(data?: Protocol.Input.DragData): Promise<void>;
}
```

## Parameters

| Parameter | Type                    | Description       |
| --------- | ----------------------- | ----------------- |
| data      | Protocol.Input.DragData | <i>(Optional)</i> |

**Returns:**

Promise&lt;void&gt;
