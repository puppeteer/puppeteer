---
sidebar_label: networkConditions
---

# networkConditions variable

A list of network conditions to be used with `page.emulateNetworkConditions(networkConditions)`. Actual list of predefined conditions can be found in [src/common/NetworkConditions.ts](https://github.com/puppeteer/puppeteer/blob/main/src/common/NetworkConditions.ts).

**Signature:**

```typescript
networkConditions: Readonly<{
    'Slow 3G': NetworkConditions;
    'Fast 3G': NetworkConditions;
}>
```

## Example

```ts
const puppeteer = require('puppeteer');
const slow3G = puppeteer.networkConditions['Slow 3G'];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateNetworkConditions(slow3G);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```
