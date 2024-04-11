---
sidebar_label: Touchscreen.touchMove
---

# Touchscreen.touchMove() method

Dispatches a `touchMove` event.

#### Signature:

```typescript
class Touchscreen {
  abstract touchMove(x: number, y: number): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

x

</td><td>

number

</td><td>

Horizontal position of the move.

</td></tr>
<tr><td>

y

</td><td>

number

</td><td>

Vertical position of the move.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

Not every `touchMove` call results in a `touchmove` event being emitted, depending on the browser's optimizations. For example, Chrome [throttles](https://developer.chrome.com/blog/a-more-compatible-smoother-touch/#chromes-new-model-the-throttled-async-touchmove-model) touch move events.
