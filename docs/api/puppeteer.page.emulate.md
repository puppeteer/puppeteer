---
sidebar_label: Page.emulate
---

# Page.emulate() method

Emulates given device metrics and user agent.

**Signature:**

```typescript
class Page {
  emulate(options: {viewport: Viewport; userAgent: string}): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description |
| --------- | --------------------------------------------------------------------- | ----------- |
| options   | { viewport: [Viewport](./puppeteer.viewport.md); userAgent: string; } |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

List of all available devices is available in the source code: [src/common/DeviceDescriptors.ts](https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts).

## Example

```ts
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```
