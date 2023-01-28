---
sidebar_label: Touchscreen
---

# Touchscreen class

The Touchscreen class exposes touchscreen events.

#### Signature:

```typescript
export declare class Touchscreen
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Touchscreen` class.

## Methods

| Method                                      | Modifiers | Description                                                           |
| ------------------------------------------- | --------- | --------------------------------------------------------------------- |
| [tap(x, y)](./puppeteer.touchscreen.tap.md) |           | Dispatches a <code>touchstart</code> and <code>touchend</code> event. |
| [drag(x, y)](./puppeteer.touchscreen.drag.md) |           | Dispatches a <code>touchstart</code> and <code>setTimeout</code>  and <code>touchend</code> event. |
| [press(x, y)](./puppeteer.touchscreen.press.md) |           | Dispatches a <code>touchstart</code>and <code>touchMove</code> and <code>touchend</code> event. |
