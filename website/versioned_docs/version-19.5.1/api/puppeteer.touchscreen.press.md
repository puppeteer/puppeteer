---
sidebar_label: Touchscreen.press
---

# Touchscreen.press() method

Dispatches a `touchstart` and `touchend` event.

#### Signature:

```typescript
class Touchscreen {
  press(x: number, y: number,delay : number): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                     |
| --------- | ------ | ------------------------------- |
| x         | number | Horizontal position of the tap. |
| y         | number | Vertical position of the tap.   |
| [delay](./puppeteer.clickoptions.delay.md)           | number                                    | <i>(Optional)</i> Time to wait between <code>touchstart</code> and <code>touchend</code> in milliseconds. | 0       |

**Returns:**

Promise&lt;void&gt;
