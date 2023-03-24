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
    options?: MouseOptions & {
      delay?: number;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description                                      |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| x         | number                                                                | Horizontal position of the mouse.                |
| y         | number                                                                | Vertical position of the mouse.                  |
| options   | [MouseOptions](./puppeteer.mouseoptions.md) &amp; { delay?: number; } | _(Optional)_ Optional <code>MouseOptions</code>. |

**Returns:**

Promise&lt;void&gt;
