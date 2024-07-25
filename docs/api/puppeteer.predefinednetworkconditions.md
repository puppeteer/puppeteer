---
sidebar_label: PredefinedNetworkConditions
---

# PredefinedNetworkConditions variable

A list of pre-defined network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

### Signature

```typescript
PredefinedNetworkConditions: Readonly<{
  'Slow 3G': NetworkConditions;
  'Fast 3G': NetworkConditions;
  'Slow 4G': NetworkConditions;
  'Fast 4G': NetworkConditions;
}>;
```

## Example

```ts
import {PredefinedNetworkConditions} from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 3G']);
  await page.goto('https://www.google.com');
  await page.emulateNetworkConditions(PredefinedNetworkConditions['Fast 3G']);
  await page.goto('https://www.google.com');
  await page.emulateNetworkConditions(PredefinedNetworkConditions['Slow 4G']); // alias to Fast 3G.
  await page.goto('https://www.google.com');
  await page.emulateNetworkConditions(PredefinedNetworkConditions['Fast 4G']);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```
