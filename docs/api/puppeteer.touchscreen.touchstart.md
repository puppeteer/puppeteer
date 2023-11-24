---
sidebar_label: Touchscreen.touchStart
---

# Touchscreen.touchStart() method

Dispatches a `touchstart` event.

#### Signature:

```typescript
class Touchscreen &#123;abstract touchStart(x: number, y: number): Promise<void>;&#125;
```

## Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| x         | number | Horizontal position of the tap. |
| y         | number | Vertical position of the tap.   |

**Returns:**

Promise&lt;void&gt;
