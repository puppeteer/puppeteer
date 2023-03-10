---
sidebar_label: ScreenshotOptions
---

# ScreenshotOptions interface

#### Signature:

```typescript
export interface ScreenshotOptions
```

## Properties

| Property                                                                         | Modifiers | Type                                            | Description                                                                                                                                                                                                                                                     | Default             |
| -------------------------------------------------------------------------------- | --------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| [captureBeyondViewport?](./puppeteer.screenshotoptions.capturebeyondviewport.md) |           | boolean                                         | _(Optional)_ Capture the screenshot beyond the viewport.                                                                                                                                                                                                        | <code>true</code>   |
| [clip?](./puppeteer.screenshotoptions.clip.md)                                   |           | [ScreenshotClip](./puppeteer.screenshotclip.md) | _(Optional)_ An object which specifies the clipping region of the page.                                                                                                                                                                                         |                     |
| [encoding?](./puppeteer.screenshotoptions.encoding.md)                           |           | 'base64' \| 'binary'                            | _(Optional)_ Encoding of the image.                                                                                                                                                                                                                             | <code>binary</code> |
| [fromSurface?](./puppeteer.screenshotoptions.fromsurface.md)                     |           | boolean                                         | _(Optional)_ Capture the screenshot from the surface, rather than the view.                                                                                                                                                                                     | <code>true</code>   |
| [fullPage?](./puppeteer.screenshotoptions.fullpage.md)                           |           | boolean                                         | _(Optional)_ When <code>true</code>, takes a screenshot of the full page.                                                                                                                                                                                       | <code>false</code>  |
| [omitBackground?](./puppeteer.screenshotoptions.omitbackground.md)               |           | boolean                                         | _(Optional)_ Hides default white background and allows capturing screenshots with transparency.                                                                                                                                                                 | <code>false</code>  |
| [path?](./puppeteer.screenshotoptions.path.md)                                   |           | string                                          | _(Optional)_ The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk. |                     |
| [quality?](./puppeteer.screenshotoptions.quality.md)                             |           | number                                          | _(Optional)_ Quality of the image, between 0-100. Not applicable to <code>png</code> images.                                                                                                                                                                    |                     |
| [type?](./puppeteer.screenshotoptions.type.md)                                   |           | 'png' \| 'jpeg' \| 'webp'                       | _(Optional)_                                                                                                                                                                                                                                                    | <code>png</code>    |
