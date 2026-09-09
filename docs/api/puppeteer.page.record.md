---
sidebar_label: Page.record
---

# Page.record() method

Records this [page](./puppeteer.page.md) using the Chrome DevTools Protocol [Page.startScreenRecording](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-startScreenRecording) API.

Outputs mp4 video stream.

### Signature

```typescript
class Page {
  record(options?: Readonly<RecordOptions>): Promise<ScreenRecording>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

options

</td><td>

Readonly&lt;[RecordOptions](./puppeteer.recordoptions.md)&gt;

</td><td>

_(Optional)_ Configures recording behavior.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[ScreenRecording](./puppeteer.screenrecording.md)&gt;

## Example

Recording a [page](./puppeteer.page.md):

```ts
import puppeteer from 'puppeteer';

// Launch a browser
const browser = await puppeteer.launch();

// Create a new page
const page = await browser.newPage();

// Go to your site.
await page.goto('https://www.example.com');

// Start recording.
const recorder = await page.record({path: 'recording.mp4'});

// Do something.

// Stop recording.
await recorder.stop();

await browser.close();
```
