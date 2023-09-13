---
sidebar_label: Page.emulate
---

# Page.emulate() method

Emulates a given device's metrics and user agent.

To aid emulation, Puppeteer provides a list of known devices that can be via [KnownDevices](./puppeteer.knowndevices.md).

#### Signature:

```typescript
class Page {
  emulate(device: Device): Promise<void>;
}
```

## Parameters

| Parameter | Type                            | Description |
| --------- | ------------------------------- | ----------- |
| device    | [Device](./puppeteer.device.md) |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

This method will resize the page. A lot of websites don't expect phones to change size, so you should emulate before navigating to the page.

## Example

```ts
import {KnownDevices} from 'puppeteer';
const iPhone = KnownDevices['iPhone 6'];

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
})();
```
