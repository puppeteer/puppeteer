---
sidebar_label: RecordOptions
---

# RecordOptions interface

### Signature

```typescript
export interface RecordOptions
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

<span id="audio">audio</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Whether to record audio.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="browserwindow">browserWindow</span>

</td><td>

`optional`

</td><td>

boolean

</td><td>

Records the browser window that shows this page, instead of only the page's content area. The recording includes the browser UI, for example the tab strip and the omnibox. If DevTools is docked in the window, the recording also includes DevTools.

Requires Chrome 159 or later. Not supported in WebDriver BiDi.

**Remarks:**

- The recording shows what the window shows. If this page is not the active tab of its window, the recording shows the active tab.

- Chrome shows a screen sharing notification while it records. If the user stops the capture from the notification, the video stops at that point. [ScreenRecording.stop()](./puppeteer.screenrecording.stop.md) still returns the video.

- Not available in `chrome-headless-shell` (`headless: 'shell'`). In `headless: true`, the recording uses the size of the browser window. Use the `--window-size` argument to change it.

- Chrome returns an error when the target is an undocked DevTools window or when the `ScreenCaptureAllowed` policy blocks screen capture.

- Audio (with `audio: true`) comes from this page only.

</td><td>

`false`

</td></tr>
<tr><td>

<span id="fps">fps</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Frame rate in frames per second (alias for frameRate).

</td><td>

</td></tr>
<tr><td>

<span id="framerate">frameRate</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum frame rate in frames per second.

</td><td>

</td></tr>
<tr><td>

<span id="maxheight">maxHeight</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum frame height in pixels.

</td><td>

</td></tr>
<tr><td>

<span id="maxwidth">maxWidth</span>

</td><td>

`optional`

</td><td>

number

</td><td>

Maximum frame width in pixels.

</td><td>

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

string

</td><td>

File path to save the recording to.

</td><td>

</td></tr>
</tbody></table>
