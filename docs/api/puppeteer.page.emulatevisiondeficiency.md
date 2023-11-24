---
sidebar_label: Page.emulateVisionDeficiency
---

# Page.emulateVisionDeficiency() method

Simulates the given vision deficiency on the page.

#### Signature:

```typescript
class Page &#123;abstract emulateVisionDeficiency(type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type']): Promise<void>;&#125;
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

(async () => &#123;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://v8.dev/blog/10-years');

  await page.emulateVisionDeficiency('achromatopsia');
  await page.screenshot(&#123;path: 'achromatopsia.png'&#125;);

  await page.emulateVisionDeficiency('deuteranopia');
  await page.screenshot(&#123;path: 'deuteranopia.png'&#125;);

  await page.emulateVisionDeficiency('blurredVision');
  await page.screenshot(&#123;path: 'blurred-vision.png'&#125;);

  await browser.close();
&#125;)();
```
