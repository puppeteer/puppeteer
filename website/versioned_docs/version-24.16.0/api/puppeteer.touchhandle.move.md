---
sidebar_label: TouchHandle.move
---

# TouchHandle.move() method

Dispatches a `touchMove` event for this touch.

### Signature

```typescript
interface TouchHandle {
  move(x: number, y: number): Promise<void>;
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
