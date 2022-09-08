---
sidebar_label: devices
---

# devices variable

A list of devices to be used with `page.emulate(options)`. Actual list of devices can be found in [src/common/DeviceDescriptors.ts](https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts).

**Signature:**

```typescript
devices: DevicesMap;
```

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
