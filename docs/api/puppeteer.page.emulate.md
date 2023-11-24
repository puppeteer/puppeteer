---
sidebar_label: Page.emulate
---

# Page.emulate() method

Emulates a given device's metrics and user agent.

To aid emulation, Puppeteer provides a list of known devices that can be via [KnownDevices](./puppeteer.knowndevices.md).

#### Signature:

```typescript
class Page &#123;emulate(device: Device): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                            | Description |
| --------- | ------------------------------- | ----------- |
| device    | [Device](./puppeteer.device.md) |             |

**Returns:**

Promise&lt;void&gt;

## Remarks

This method is a shortcut for calling two methods: [Page.setUserAgent()](./puppeteer.page.setuseragent.md) and [Page.setViewport()](./puppeteer.page.setviewport.md).

This method will resize the page. A lot of websites don't expect phones to change size, so you should emulate before navigating to the page.

## Example

```ts
import &#123;KnownDevices&#125; from 'puppeteer';
const iPhone = KnownDevices['iPhone 6'];

(async () => &#123;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto('https://www.google.com');
  // other actions...
  await browser.close();
&#125;)();
```
