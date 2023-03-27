---
sidebar_label: ClickOptions
---

# ClickOptions interface

#### Signature:

```typescript
export interface ClickOptions
```

## Properties

| Property   | Modifiers             | Type                                      | Description                                                                           | Default |
| ---------- | --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | ------- |
| button     | <code>optional</code> | [MouseButton](./puppeteer.mousebutton.md) |                                                                                       | 'left'  |
| clickCount | <code>optional</code> | number                                    |                                                                                       | 1       |
| delay      | <code>optional</code> | number                                    | Time to wait between <code>mousedown</code> and <code>mouseup</code> in milliseconds. | 0       |
| offset     | <code>optional</code> | [Offset](./puppeteer.offset.md)           | Offset for the clickable point relative to the top-left corner of the border box.     |         |
