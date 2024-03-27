---
sidebar_label: ScreenshotOptions
---

# ScreenshotOptions interface

#### Signature:

```typescript
export interface ScreenshotOptions
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

captureBeyondViewport

</td><td>

`optional`

</td><td>

boolean

</td><td>

Capture the screenshot beyond the viewport.

</td><td>

`false` if there is no `clip`. `true` otherwise.

</td></tr>
<tr><td>

clip

</td><td>

`optional`

</td><td>

[ScreenshotClip](./puppeteer.screenshotclip.md)

</td><td>

Specifies the region of the page/element to clip.

</td><td>

</td></tr>
<tr><td>

encoding

</td><td>

`optional`

</td><td>

'base64' \| 'binary'

</td><td>

Encoding of the image.

</td><td>

`'binary'`

</td></tr>
<tr><td>

fromSurface

</td><td>

`optional`

</td><td>

boolean

</td><td>

Capture the screenshot from the surface, rather than the view.

</td><td>

`true`

</td></tr>
<tr><td>

fullPage

</td><td>

`optional`

</td><td>

boolean

</td><td>

When `true`, takes a screenshot of the full page.

</td><td>

`false`

</td></tr>
<tr><td>

omitBackground

</td><td>

`optional`

</td><td>

boolean

</td><td>

Hides default white background and allows capturing screenshots with transparency.

</td><td>

`false`

</td></tr>
<tr><td>

optimizeForSpeed

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

`false`

</td></tr>
<tr><td>

path

</td><td>

`optional`

</td><td>

string

</td><td>

The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk.

</td><td>

</td></tr>
<tr><td>

quality

</td><td>

`optional`

</td><td>

number

</td><td>

Quality of the image, between 0-100. Not applicable to `png` images.

</td><td>

</td></tr>
<tr><td>

type

</td><td>

`optional`

</td><td>

'png' \| 'jpeg' \| 'webp'

</td><td>

</td><td>

`'png'`

</td></tr>
</tbody></table>
