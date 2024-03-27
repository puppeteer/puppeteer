---
sidebar_label: PredefinedNetworkConditions
---

# PredefinedNetworkConditions variable

A list of network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

#### Signature:

```typescript
PredefinedNetworkConditions: Readonly<{
  'Slow 3G': NetworkConditions;
  'Fast 3G': NetworkConditions;
}>;
```

## Example

```ts
import {PredefinedNetworkConditions} from 'puppeteer';
const slow3G = PredefinedNetworkConditions['Slow 3G'];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateNetworkConditions(slow3G);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```
