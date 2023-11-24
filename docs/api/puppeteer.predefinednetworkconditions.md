---
sidebar_label: PredefinedNetworkConditions
---

# PredefinedNetworkConditions variable

A list of network conditions to be used with [Page.emulateNetworkConditions()](./puppeteer.page.emulatenetworkconditions.md).

#### Signature:

```typescript
PredefinedNetworkConditions: Readonly<&#123;
    'Slow 3G': NetworkConditions;
    'Fast 3G': NetworkConditions;
&#125;>
```

## Example

```ts
import &#123;PredefinedNetworkConditions&#125; from 'puppeteer';
const slow3G = PredefinedNetworkConditions['Slow 3G'];

(async () => &#123;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulateNetworkConditions(slow3G);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
&#125;)();
```
