---
sidebar_label: ElementHandle.dragOver
---

# ElementHandle.dragOver() method

This method creates a `dragover` event on the element.

**Signature:**

```typescript
class ElementHandle {
  dragOver(data?: Protocol.Input.DragData): Promise<void>;
}
```

## Parameters

| Parameter | Type                    | Description       |
| --------- | ----------------------- | ----------------- |
| data      | Protocol.Input.DragData | <i>(Optional)</i> |

**Returns:**

Promise&lt;void&gt;
