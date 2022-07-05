---
sidebar_label: ScreenshotOptions
---

# ScreenshotOptions interface

**Signature:**

```typescript
export interface ScreenshotOptions
```

## Properties

| Property                                                                         | Modifiers | Type                                            | Description                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------- | --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [captureBeyondViewport?](./puppeteer.screenshotoptions.capturebeyondviewport.md) |           | boolean                                         | <i>(Optional)</i> Capture the screenshot beyond the viewport.                                                                                                                                                                                                        |
| [clip?](./puppeteer.screenshotoptions.clip.md)                                   |           | [ScreenshotClip](./puppeteer.screenshotclip.md) | <i>(Optional)</i> An object which specifies the clipping region of the page.                                                                                                                                                                                         |
| [encoding?](./puppeteer.screenshotoptions.encoding.md)                           |           | 'base64' \| 'binary'                            | <i>(Optional)</i> Encoding of the image.                                                                                                                                                                                                                             |
| [fromSurface?](./puppeteer.screenshotoptions.fromsurface.md)                     |           | boolean                                         | <i>(Optional)</i> Capture the screenshot from the surface, rather than the view.                                                                                                                                                                                     |
| [fullPage?](./puppeteer.screenshotoptions.fullpage.md)                           |           | boolean                                         | <i>(Optional)</i> When true, takes a screenshot of the full page.                                                                                                                                                                                                    |
| [omitBackground?](./puppeteer.screenshotoptions.omitbackground.md)               |           | boolean                                         | <i>(Optional)</i> Hides default white background and allows capturing screenshots with transparency.                                                                                                                                                                 |
| [path?](./puppeteer.screenshotoptions.path.md)                                   |           | string                                          | <i>(Optional)</i> The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk. |
| [quality?](./puppeteer.screenshotoptions.quality.md)                             |           | number                                          | <i>(Optional)</i> Quality of the image, between 0-100. Not applicable to <code>png</code> images.                                                                                                                                                                    |
| [type?](./puppeteer.screenshotoptions.type.md)                                   |           | 'png' \| 'jpeg' \| 'webp'                       | <i>(Optional)</i>                                                                                                                                                                                                                                                    |
