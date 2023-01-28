---
sidebar_label: Touchscreen.drag
---

# Touchscreen.drag() method

Dispatches a `touchstart`and `touchMove` and `touchend` event.

#### Signature:

```typescript
class Touchscreen {
  drag(start: Point, target: Point): Promise<void>;
}
```

## Parameters

| Parameter | Type                          | Description                |
| --------- | ----------------------------- | -------------------------- |
| start     | [Point](./puppeteer.point.md) | Start position of the tap. |
| target    | [Point](./puppeteer.point.md) | End position of the tap.   |

**Returns:**

Promise&lt;void&gt;
