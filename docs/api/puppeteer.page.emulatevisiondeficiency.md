---
sidebar_label: Page.emulateVisionDeficiency
---

# Page.emulateVisionDeficiency() method

Simulates the given vision deficiency on the page.

#### Signature:

```typescript
class Page {
  emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                                       |
| --------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| type      | Protocol.Emulation.SetEmulatedVisionDeficiencyRequest\['type'\] | _(Optional)_ the type of deficiency to simulate, or <code>'none'</code> to reset. |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://v8.dev/blog/10-years');

  await page.emulateVisionDeficiency('achromatopsia');
  await page.screenshot({path: 'achromatopsia.png'});

  await page.emulateVisionDeficiency('deuteranopia');
  await page.screenshot({path: 'deuteranopia.png'});

  await page.emulateVisionDeficiency('blurredVision');
  await page.screenshot({path: 'blurred-vision.png'});

  await browser.close();
})();
```
