---
sidebar_label: Touchscreen.touchMove
---

# Touchscreen.touchMove() method

Dispatches a `touchMove` event.

#### Signature:

```typescript
class Touchscreen {
  touchMove(x: number, y: number): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| x         | number | Horizontal position of the move. |
| y         | number | Vertical position of the move.   |

**Returns:**

Promise&lt;void&gt;
