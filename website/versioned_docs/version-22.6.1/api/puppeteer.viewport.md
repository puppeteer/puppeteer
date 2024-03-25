---
sidebar_label: Viewport
---

# Viewport interface

#### Signature:

```typescript
export interface Viewport
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

deviceScaleFactor

</td><td>

`optional`

</td><td>

number

</td><td>

Specify device scale factor. See [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) for more info.

</td><td>

`1`

</td></tr>
<tr><td>

hasTouch

</td><td>

`optional`

</td><td>

boolean

</td><td>

Specify if the viewport supports touch events.

</td><td>

`false`

</td></tr>
<tr><td>

height

</td><td>

</td><td>

number

</td><td>

The page height in CSS pixels.

</td><td>

</td></tr>
<tr><td>

isLandscape

</td><td>

`optional`

</td><td>

boolean

</td><td>

Specifies if the viewport is in landscape mode.

</td><td>

`false`

</td></tr>
<tr><td>

isMobile

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether the `meta viewport` tag is taken into account.

</td><td>

`false`

</td></tr>
<tr><td>

width

</td><td>

</td><td>

number

</td><td>

The page width in CSS pixels.

</td><td>

</td></tr>
</tbody></table>
