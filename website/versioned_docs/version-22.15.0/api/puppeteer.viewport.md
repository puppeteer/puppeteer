---
sidebar_label: Viewport
---

# Viewport interface

### Signature

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

<span id="devicescalefactor">deviceScaleFactor</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specify device scale factor. See [devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) for more info.

**Remarks:**

Setting this value to `0` will reset this value to the system default.

</td><td>

`1`

</td></tr>
<tr><td>

<span id="hastouch">hasTouch</span>

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

<span id="height">height</span>

</td><td>

</td><td>

number

</td><td>

The page height in CSS pixels.

**Remarks:**

Setting this value to `0` will reset this value to the system default.

</td><td>

</td></tr>
<tr><td>

<span id="islandscape">isLandscape</span>

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

<span id="ismobile">isMobile</span>

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

<span id="width">width</span>

</td><td>

</td><td>

number

</td><td>

The page width in CSS pixels.

**Remarks:**

Setting this value to `0` will reset this value to the system default.

</td><td>

</td></tr>
</tbody></table>
