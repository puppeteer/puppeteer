---
sidebar_label: Page.emulateVisionDeficiency
---

# Page.emulateVisionDeficiency() method

Simulates the given vision deficiency on the page.

### Signature

```typescript
class Page {
  abstract emulateVisionDeficiency(
    type?: Protocol.Emulation.SetEmulatedVisionDeficiencyRequest['type'],
  ): Promise<void>;
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

type

</td><td>

Protocol.Emulation.SetEmulatedVisionDeficiencyRequest\['type'\]

</td><td>

_(Optional)_ the type of deficiency to simulate, or `'none'` to reset.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Example

```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://v8.dev/blog/10-years');

await page.emulateVisionDeficiency('achromatopsia');
await page.screenshot({path: 'achromatopsia.png'});

await page.emulateVisionDeficiency('deuteranopia');
await page.screenshot({path: 'deuteranopia.png'});

await page.emulateVisionDeficiency('blurredVision');
await page.screenshot({path: 'blurred-vision.png'});

await page.emulateVisionDeficiency('reducedContrast');
await page.screenshot({path: 'reduced-contrast.png'});

await browser.close();
```
