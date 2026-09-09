---
sidebar_label: Touchscreen
---

# Touchscreen class

The Touchscreen class exposes touchscreen events.

### Signature

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

<span id="tap">[tap(x, y)](./puppeteer.touchscreen.tap.md)</span>

</td><td>

</td><td>

Dispatches a `touchstart` and `touchend` event.

</td></tr>
<tr><td>

<span id="touchend">[touchEnd()](./puppeteer.touchscreen.touchend.md)</span>

</td><td>

</td><td>

Dispatches a `touchend` event on the first touch that is active.

</td></tr>
<tr><td>

<span id="touchmove">[touchMove(x, y)](./puppeteer.touchscreen.touchmove.md)</span>

</td><td>

</td><td>

Dispatches a `touchMove` event on the first touch that is active.

**Remarks:**

Not every `touchMove` call results in a `touchmove` event being emitted, depending on the browser's optimizations. For example, Chrome [throttles](https://developer.chrome.com/blog/a-more-compatible-smoother-touch/#chromes-new-model-the-throttled-async-touchmove-model) touch move events.

</td></tr>
<tr><td>

<span id="touchstart">[touchStart(x, y)](./puppeteer.touchscreen.touchstart.md)</span>

</td><td>

</td><td>

Dispatches a `touchstart` event.

</td></tr>
</tbody></table>
