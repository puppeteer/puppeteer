---
sidebar_label: ClickOptions
---

# ClickOptions interface

#### Signature:

```typescript
export interface ClickOptions
```

## Properties

| Property                                              | Modifiers | Type                                      | Description                                                                                        | Default |
| ----------------------------------------------------- | --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- | ------- |
| [button?](./puppeteer.clickoptions.button.md)         |           | [MouseButton](./puppeteer.mousebutton.md) | _(Optional)_                                                                                       | 'left'  |
| [clickCount?](./puppeteer.clickoptions.clickcount.md) |           | number                                    | _(Optional)_                                                                                       | 1       |
| [delay?](./puppeteer.clickoptions.delay.md)           |           | number                                    | _(Optional)_ Time to wait between <code>mousedown</code> and <code>mouseup</code> in milliseconds. | 0       |
| [offset?](./puppeteer.clickoptions.offset.md)         |           | [Offset](./puppeteer.offset.md)           | _(Optional)_ Offset for the clickable point relative to the top-left corner of the border box.     |         |
