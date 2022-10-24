---
sidebar_label: Page.emulateNetworkConditions
---

# Page.emulateNetworkConditions() method

This does not affect WebSockets and WebRTC PeerConnections (see https://crbug.com/563644). To set the page offline, you can use [Page.setOfflineMode()](./puppeteer.page.setofflinemode.md).

A list of predefined network conditions can be used by importing [PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md).

#### Signature:

```typescript
class Page {
  emulateNetworkConditions(
    networkConditions: NetworkConditions | null
  ): Promise<void>;
}
```

## Parameters

| Parameter         | Type                                                          | Description                                                     |
| ----------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| networkConditions | [NetworkConditions](./puppeteer.networkconditions.md) \| null | Passing <code>null</code> disables network condition emulation. |

**Returns:**

Promise&lt;void&gt;

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
