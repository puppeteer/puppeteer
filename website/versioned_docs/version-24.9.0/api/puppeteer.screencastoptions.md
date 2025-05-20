---
sidebar_label: ScreencastOptions
---

# ScreencastOptions interface

### Signature

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

<span id="colors">colors</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the maximum number of [palette](https://ffmpeg.org/ffmpeg-filters.html#palettegen) colors to quantize, with GIF limited to `256`. Restrict the palette to only necessary colors to reduce output file size.

</td><td>

`256`

</td></tr>
<tr><td>

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

<span id="delay">delay</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the delay between iterations of a loop, in ms. `-1` is a special value to re-use the previous delay.

</td><td>

`-1`

</td></tr>
<tr><td>

<span id="ffmpegpath">ffmpegPath</span>

</td><td>

`optional`

</td><td>

string

</td><td>

Path to the [ffmpeg](https://ffmpeg.org/).

Required if `ffmpeg` is not in your PATH.

</td><td>

`'ffmpeg'`

</td></tr>
<tr><td>

<span id="format">format</span>

</td><td>

`optional`

</td><td>

[VideoFormat](./puppeteer.videoformat.md)

</td><td>

Specifies the output file format.

</td><td>

`'webm'`

</td></tr>
<tr><td>

<span id="fps">fps</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the frame rate in frames per second.

</td><td>

`30` (`20` for GIF)

</td></tr>
<tr><td>

<span id="loop">loop</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the number of times to loop playback, from `0` to `Infinity`. A value of `0` or `undefined` will disable looping.

</td><td>

`undefined`

</td></tr>
<tr><td>

<span id="overwrite">overwrite</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Specifies whether to overwrite output file, or exit immediately if it already exists.

</td><td>

`true`

</td></tr>
<tr><td>

<span id="path">path</span>

</td><td>

`optional`

</td><td>

\`$&#123;string&#125;.$&#123;[VideoFormat](./puppeteer.videoformat.md)&#125;\`

</td><td>

File path to save the screencast to.

</td><td>

</td></tr>
<tr><td>

<span id="quality">quality</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Specifies the recording [quality](https://trac.ffmpeg.org/wiki/Encode/VP9#constantq) Constant Rate Factor between `0`–`63`. Lower values mean better quality.

</td><td>

`30`

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
