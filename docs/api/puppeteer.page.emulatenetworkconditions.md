---
sidebar_label: Page.emulateNetworkConditions
---

# Page.emulateNetworkConditions() method

This does not affect WebSockets and WebRTC PeerConnections (see https://crbug.com/563644). To set the page offline, you can use [Page.setOfflineMode()](./puppeteer.page.setofflinemode.md).

A list of predefined network conditions can be used by importing [PredefinedNetworkConditions](./puppeteer.predefinednetworkconditions.md).

#### Signature:

```typescript
class Page {
  abstract emulateNetworkConditions(
    networkConditions: NetworkConditions | null
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

networkConditions

</td><td>

[NetworkConditions](./puppeteer.networkconditions.md) \| null

</td><td>

Passing `null` disables network condition emulation.

</td></tr>
</tbody></table>
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
