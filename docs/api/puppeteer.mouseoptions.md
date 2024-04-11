---
sidebar_label: MouseOptions
---

# MouseOptions interface

#### Signature:

```typescript
export interface MouseOptions
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<p id="button">button</p>

</td><td>

`optional`

</td><td>

[MouseButton](./puppeteer.mousebutton.md)

</td><td>

Determines which button will be pressed.

</td><td>

`'left'`

</td></tr>
<tr><td>

<p id="clickcount">clickCount</p>

</td><td>

`optional, deprecated`

</td><td>

number

</td><td>

Determines the click count for the mouse event. This does not perform multiple clicks.

**Deprecated:**

Use [MouseClickOptions.count](./puppeteer.mouseclickoptions.md#count).

</td><td>

`1`

</td></tr>
</tbody></table>
