---
sidebar_label: Mouse.drop
---

# Mouse.drop() method

### Signature:

```typescript
class Mouse {
  abstract drop(target: Point, data: Protocol.Input.DragData): Promise<void>;
}
```

Performs a dragenter, dragover, and drop in sequence.

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

target

</td><td>

[Point](./puppeteer.point.md)

</td><td>

point to drop on

</td></tr>
<tr><td>

data

</td><td>

Protocol.Input.DragData

</td><td>

drag data containing items and operations mask

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
