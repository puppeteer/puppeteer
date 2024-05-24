---
sidebar_label: ScreencastOptions
---

# ScreencastOptions interface

#### Signature:

```typescript
export interface ScreencastOptions
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

<span id="crop">crop</span>

</td><td>

`optional`

</td><td>

[BoundingBox](./puppeteer.boundingbox.md)

</td><td>

Specifies the region of the viewport to crop.

</td><td>

</td></tr>
<tr><td>

<span id="ffmpegpath">ffmpegPath</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to the \[ffmpeg\](https://ffmpeg.org/).

Required if `ffmpeg` is not in your PATH.

</td><td>

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

\`$&#123;string&#125;.webm\`

</td><td>

File path to save the screencast to.

</td><td>

</td></tr>
<tr><td>

<span id="scale">scale</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Scales the output video.

For example, `0.5` will shrink the width and height of the output video by half. `2` will double the width and height of the output video.

</td><td>

`1`

</td></tr>
<tr><td>

<span id="speed">speed</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the speed to record at.

For example, `0.5` will slowdown the output video by 50%. `2` will double the speed of the output video.

</td><td>

`1`

</td></tr>
</tbody></table>
