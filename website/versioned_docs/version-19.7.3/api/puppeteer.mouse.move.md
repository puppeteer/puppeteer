---
sidebar_label: Mouse.move
---

# Mouse.move() method

Dispatches a `mousemove` event.

#### Signature:

```typescript
class Mouse {
  move(
    x: number,
    y: number,
    options?: {
      steps?: number;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                | Description                                                                                                                                                        |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| x         | number              | Horizontal position of the mouse.                                                                                                                                  |
| y         | number              | Vertical position of the mouse.                                                                                                                                    |
| options   | { steps?: number; } | _(Optional)_ Optional object. If specified, the <code>steps</code> property sends intermediate <code>mousemove</code> events when set to <code>1</code> (default). |

**Returns:**

Promise&lt;void&gt;
