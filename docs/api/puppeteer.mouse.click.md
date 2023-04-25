---
sidebar_label: Mouse.click
---

# Mouse.click() method

Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.

#### Signature:

```typescript
class Mouse {
  click(
    x: number,
    y: number,
    options?: Readonly<MouseClickOptions>
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description                                 |
| --------- | --------------------------------------------------------------------- | ------------------------------------------- |
| x         | number                                                                | Horizontal position of the mouse.           |
| y         | number                                                                | Vertical position of the mouse.             |
| options   | Readonly&lt;[MouseClickOptions](./puppeteer.mouseclickoptions.md)&gt; | _(Optional)_ Options to configure behavior. |

**Returns:**

Promise&lt;void&gt;
