---
sidebar_label: Page.screencast
---

# Page.screencast() method

Captures a screencast of this [page](./puppeteer.page.md).

#### Signature:

```typescript
class Page {
  screencast(options?: Readonly<ScreencastOptions>): Promise<ScreenRecorder>;
}
```

## Parameters

| Parameter | Type                                                                  | Description                                  |
| --------- | --------------------------------------------------------------------- | -------------------------------------------- |
| options   | Readonly&lt;[ScreencastOptions](./puppeteer.screencastoptions.md)&gt; | _(Optional)_ Configures screencast behavior. |

**Returns:**

Promise&lt;[ScreenRecorder](./puppeteer.screenrecorder.md)&gt;

## Remarks

All recordings will be [WebM](https://www.webmproject.org/) format using the [VP9](https://www.webmproject.org/vp9/) video codec. The FPS is 30.

You must have [ffmpeg](https://ffmpeg.org/) installed on your system.

## Example

Recording a [page](./puppeteer.page.md):

```
import puppeteer from 'puppeteer';

// Launch a browser
const browser = await puppeteer.launch();

// Create a new page
const page = await browser.newPage();

// Go to your site.
await page.goto("https://www.example.com");

// Start recording.
const recorder = await page.screencast({path: 'recording.webm'});

// Do something.

// Stop recording.
await recorder.stop();

browser.close();
```
