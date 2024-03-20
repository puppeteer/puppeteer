---
sidebar_label: Mouse.move
---

# Mouse.move() method

Moves the mouse to the given coordinate.

#### Signature:

```typescript
class Mouse {
  abstract move(
    x: number,
    y: number,
    options?: Readonly<MouseMoveOptions>
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

x

</td><td>

number

</td><td>

Horizontal position of the mouse.

</td></tr>
<tr><td>

y

</td><td>

number

</td><td>

Vertical position of the mouse.

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[MouseMoveOptions](./puppeteer.mousemoveoptions.md)&gt;

</td><td>

_(Optional)_ Options to configure behavior.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
