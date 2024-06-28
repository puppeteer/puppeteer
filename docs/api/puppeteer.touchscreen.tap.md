---
sidebar_label: Touchscreen.tap
---

# Touchscreen.tap() method

### Signature:

```typescript
class Touchscreen {
  tap(x: number, y: number): Promise<void>;
}
```

Dispatches a `touchstart` and `touchend` event.

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

Horizontal position of the tap.

</td></tr>
<tr><td>

y

</td><td>

number

</td><td>

Vertical position of the tap.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
