---
sidebar_label: Mouse.move
---

# Mouse.move() method

Moves the mouse to the given coordinate.

#### Signature:

```typescript
class Mouse {
  move(x: number, y: number, options?: MouseMoveOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                | Description                                 |
| --------- | --------------------------------------------------- | ------------------------------------------- |
| x         | number                                              | Horizontal position of the mouse.           |
| y         | number                                              | Vertical position of the mouse.             |
| options   | [MouseMoveOptions](./puppeteer.mousemoveoptions.md) | _(Optional)_ Options to configure behavior. |

**Returns:**

Promise&lt;void&gt;
