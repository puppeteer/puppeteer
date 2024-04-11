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

<p id="capturebeyondviewport">captureBeyondViewport</p>

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

<p id="clip">clip</p>

</td><td>

`optional`

</td><td>

[ScreenshotClip](./puppeteer.screenshotclip.md)

</td><td>

Specifies the region of the page/element to clip.

</td><td>

</td></tr>
<tr><td>

<p id="encoding">encoding</p>

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

<p id="fromsurface">fromSurface</p>

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

<p id="fullpage">fullPage</p>

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

<p id="omitbackground">omitBackground</p>

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

<p id="optimizeforspeed">optimizeForSpeed</p>

</td><td>

`optional`

</td><td>

boolean

</td><td>

</td><td>

`false`

</td></tr>
<tr><td>

<p id="path">path</p>

</td><td>

`optional`

</td><td>

string

</td><td>

The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk.

</td><td>

</td></tr>
<tr><td>

<p id="quality">quality</p>

</td><td>

`optional`

</td><td>

number

</td><td>

Quality of the image, between 0-100. Not applicable to `png` images.

</td><td>

</td></tr>
<tr><td>

<p id="type">type</p>

</td><td>

`optional`

</td><td>

'png' \| 'jpeg' \| 'webp'

</td><td>

</td><td>

`'png'`

</td></tr>
</tbody></table>
