---
sidebar_label: Touchscreen.tap
---

# Touchscreen.tap() method

Dispatches a `touchstart` and `touchend` event.

#### Signature:

```typescript
class Touchscreen &#123;tap(x: number, y: number): Promise<void>;&#125;
```

## Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| x         | number | Horizontal position of the tap. |
| y         | number | Vertical position of the tap.   |

**Returns:**

Promise&lt;void&gt;
