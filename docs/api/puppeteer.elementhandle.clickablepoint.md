---
sidebar_label: ElementHandle.clickablePoint
---

# ElementHandle.clickablePoint() method

### Signature:

```typescript
class ElementHandle {
  clickablePoint(offset?: Offset): Promise<Point>;
}
```

Returns the middle point within an element unless a specific offset is provided.

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

offset

</td><td>

[Offset](./puppeteer.offset.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[Point](./puppeteer.point.md)&gt;
