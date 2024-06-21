---
sidebar_label: Mouse.drag
---

# Mouse.drag() method

Dispatches a `drag` event.

#### Signature:

```typescript
class Mouse {
  abstract drag(start: Point, target: Point): Promise<Protocol.Input.DragData>;
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

start

</td><td>

[Point](./puppeteer.point.md)

</td><td>

starting point for drag

</td></tr>
<tr><td>

target

</td><td>

[Point](./puppeteer.point.md)

</td><td>

point to drag to

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Protocol.Input.DragData&gt;
