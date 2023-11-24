---
sidebar_label: Mouse.move
---

# Mouse.move() method

Moves the mouse to the given coordinate.

#### Signature:

```typescript
class Mouse &#123;abstract move(x: number, y: number, options?: Readonly<MouseMoveOptions>): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                | Description                                 |
| --------- | ------------------------------------------------------------------- | ------------------------------------------- |
| x         | number                                                              | Horizontal position of the mouse.           |
| y         | number                                                              | Vertical position of the mouse.             |
| options   | Readonly&lt;[MouseMoveOptions](./puppeteer.mousemoveoptions.md)&gt; | _(Optional)_ Options to configure behavior. |

**Returns:**

Promise&lt;void&gt;
