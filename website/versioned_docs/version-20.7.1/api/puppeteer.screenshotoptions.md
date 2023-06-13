---
sidebar_label: ScreenshotOptions
---

# ScreenshotOptions interface

#### Signature:

```typescript
export interface ScreenshotOptions
```

## Properties

| Property              | Modifiers             | Type                                            | Description                                                                                                                                                                                                                                        | Default             |
| --------------------- | --------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| captureBeyondViewport | <code>optional</code> | boolean                                         | Capture the screenshot beyond the viewport.                                                                                                                                                                                                        | <code>true</code>   |
| clip                  | <code>optional</code> | [ScreenshotClip](./puppeteer.screenshotclip.md) | An object which specifies the clipping region of the page.                                                                                                                                                                                         |                     |
| encoding              | <code>optional</code> | 'base64' \| 'binary'                            | Encoding of the image.                                                                                                                                                                                                                             | <code>binary</code> |
| fromSurface           | <code>optional</code> | boolean                                         | Capture the screenshot from the surface, rather than the view.                                                                                                                                                                                     | <code>true</code>   |
| fullPage              | <code>optional</code> | boolean                                         | When <code>true</code>, takes a screenshot of the full page.                                                                                                                                                                                       | <code>false</code>  |
| omitBackground        | <code>optional</code> | boolean                                         | Hides default white background and allows capturing screenshots with transparency.                                                                                                                                                                 | <code>false</code>  |
| path                  | <code>optional</code> | string                                          | The file path to save the image to. The screenshot type will be inferred from file extension. If path is a relative path, then it is resolved relative to current working directory. If no path is provided, the image won't be saved to the disk. |                     |
| quality               | <code>optional</code> | number                                          | Quality of the image, between 0-100. Not applicable to <code>png</code> images.                                                                                                                                                                    |                     |
| type                  | <code>optional</code> | 'png' \| 'jpeg' \| 'webp'                       |                                                                                                                                                                                                                                                    | <code>png</code>    |
