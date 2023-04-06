---
sidebar_label: Page.screenshot
---

# Page.screenshot() method

Captures screenshot of the current page.

#### Signature:

```typescript
class Page {
  screenshot(
    options: ScreenshotOptions & {
      encoding: 'base64';
    }
  ): Promise<string>;
}
```

## Parameters

| Parameter | Type                                                                                | Description |
| --------- | ----------------------------------------------------------------------------------- | ----------- |
| options   | [ScreenshotOptions](./puppeteer.screenshotoptions.md) &amp; { encoding: 'base64'; } |             |

**Returns:**

Promise&lt;string&gt;

Promise which resolves to buffer or a base64 string (depending on the value of `encoding`) with captured screenshot.

## Remarks

Options object which might have the following properties:

- `path` : The file path to save the image to. The screenshot type will be inferred from file extension. If `path` is a relative path, then it is resolved relative to [current working directory](https://nodejs.org/api/process.html#process_process_cwd). If no path is provided, the image won't be saved to the disk.

- `type` : Specify screenshot type, can be either `jpeg` or `png`. Defaults to 'png'.

- `quality` : The quality of the image, between 0-100. Not applicable to `png` images.

- `fullPage` : When true, takes a screenshot of the full scrollable page. Defaults to `false`.

- `clip` : An object which specifies clipping region of the page. Should have the following fields:<br/> - `x` : x-coordinate of top-left corner of clip area.<br/> - `y` : y-coordinate of top-left corner of clip area.<br/> - `width` : width of clipping area.<br/> - `height` : height of clipping area.

- `omitBackground` : Hides default white background and allows capturing screenshots with transparency. Defaults to `false`.

- `encoding` : The encoding of the image, can be either base64 or binary. Defaults to `binary`.

- `captureBeyondViewport` : When true, captures screenshot [beyond the viewport](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot). When false, falls back to old behaviour, and cuts the screenshot by the viewport size. Defaults to `true`.

- `fromSurface` : When true, captures screenshot [from the surface rather than the view](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot). When false, works only in headful mode and ignores page viewport (but not browser window's bounds). Defaults to `true`.
