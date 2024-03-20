---
sidebar_label: Touchscreen.tap
---

# Touchscreen.tap() method

Dispatches a `touchstart` and `touchend` event.

#### Signature:

```typescript
class Touchscreen {
  tap(x: number, y: number): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| x         | number | Horizontal position of the tap. |
| y         | number | Vertical position of the tap.   |

**Returns:**

Promise&lt;void&gt;
