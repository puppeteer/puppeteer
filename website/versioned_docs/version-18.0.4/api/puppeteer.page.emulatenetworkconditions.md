---
sidebar_label: Page.emulateNetworkConditions
---

# Page.emulateNetworkConditions() method

**Signature:**

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

## Remarks

NOTE: This does not affect WebSockets and WebRTC PeerConnections (see https://crbug.com/563644). To set the page offline, you can use \[page.setOfflineMode(enabled)\](\#pagesetofflinemodeenabled).

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
