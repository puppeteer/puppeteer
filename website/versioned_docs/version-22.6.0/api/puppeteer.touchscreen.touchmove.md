---
sidebar_label: Touchscreen.touchMove
---

# Touchscreen.touchMove() method

Dispatches a `touchMove` event.

#### Signature:

```typescript
class Touchscreen {
  abstract touchMove(x: number, y: number): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                      |
| --------- | ------ | -------------------------------- |
| x         | number | Horizontal position of the move. |
| y         | number | Vertical position of the move.   |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not every `touchMove` call results in a `touchmove` event being emitted, depending on the browser's optimizations. For example, Chrome [throttles](https://developer.chrome.com/blog/a-more-compatible-smoother-touch/#chromes-new-model-the-throttled-async-touchmove-model) touch move events.
