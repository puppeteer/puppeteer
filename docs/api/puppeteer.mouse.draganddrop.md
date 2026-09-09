---
sidebar_label: Mouse.dragAndDrop
---

# Mouse.dragAndDrop() method

Performs a drag, dragenter, dragover, and drop in sequence.

### Signature

```typescript
class Mouse {
  abstract dragAndDrop(
    start: Point,
    target: Point,
    options?: {
      delay?: number;
    },
  ): Promise<void>;
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

point to drag from

</td></tr>
<tr><td>

target

</td><td>

[Point](./puppeteer.point.md)

</td><td>

point to drop on

</td></tr>
<tr><td>

options

</td><td>

&#123; delay?: number; &#125;

</td><td>

_(Optional)_ An object of options. Accepts delay which, if specified, is the time to wait between `dragover` and `drop` in milliseconds. Defaults to 0.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
