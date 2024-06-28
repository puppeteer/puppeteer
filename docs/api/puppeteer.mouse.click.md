---
sidebar_label: Mouse.click
---

# Mouse.click() method

### Signature:

```typescript
class Mouse {
  abstract click(
    x: number,
    y: number,
    options?: Readonly<MouseClickOptions>
  ): Promise<void>;
}
```

Shortcut for `mouse.move`, `mouse.down` and `mouse.up`.

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

Readonly&lt;[MouseClickOptions](./puppeteer.mouseclickoptions.md)&gt;

</td><td>

_(Optional)_ Options to configure behavior.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
