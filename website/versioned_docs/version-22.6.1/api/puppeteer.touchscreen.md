---
sidebar_label: Touchscreen
---

# Touchscreen class

The Touchscreen class exposes touchscreen events.

#### Signature:

```typescript
export declare abstract class Touchscreen
```

## Remarks

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `Touchscreen` class.

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[tap(x, y)](./puppeteer.touchscreen.tap.md)

</td><td>

</td><td>

Dispatches a `touchstart` and `touchend` event.

</td></tr>
<tr><td>

[touchEnd()](./puppeteer.touchscreen.touchend.md)

</td><td>

</td><td>

Dispatches a `touchend` event.

</td></tr>
<tr><td>

[touchMove(x, y)](./puppeteer.touchscreen.touchmove.md)

</td><td>

</td><td>

Dispatches a `touchMove` event.

</td></tr>
<tr><td>

[touchStart(x, y)](./puppeteer.touchscreen.touchstart.md)

</td><td>

</td><td>

Dispatches a `touchstart` event.

</td></tr>
</tbody></table>
