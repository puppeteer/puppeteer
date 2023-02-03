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

| Method                                                    | Modifiers | Description                                                           |
| --------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| [tap(x, y)](./puppeteer.touchscreen.tap.md)               |           | Dispatches a <code>touchstart</code> and <code>touchend</code> event. |
| [touchEnd()](./puppeteer.touchscreen.touchend.md)         |           | Dispatches a <code>touchend</code> event.                             |
| [touchMove(x, y)](./puppeteer.touchscreen.touchmove.md)   |           | Dispatches a <code>touchMove</code> event.                            |
| [touchStart(x, y)](./puppeteer.touchscreen.touchstart.md) |           | Dispatches a <code>touchstart</code> event.                           |
