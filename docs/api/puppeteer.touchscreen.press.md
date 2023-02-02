---
sidebar_label: Touchscreen.press
---

# Touchscreen.press() method

Dispatches a `touchstart` and `setTimeout` and `touchend` event.

#### Signature:

```typescript
class Touchscreen {
  press(x: number, y: number, delay: number): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| x         | number | Horizontal position of the tap. |
| y         | number | Vertical position of the tap.   |
| delay     | number | When the touch will wait        |

**Returns:**

Promise&lt;void&gt;
