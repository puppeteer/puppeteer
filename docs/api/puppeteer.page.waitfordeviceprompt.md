---
sidebar_label: Page.waitForDevicePrompt
---

# Page.waitForDevicePrompt() method

This method is typically coupled with an action that triggers a device request from an api such as WebBluetooth.

:::caution

This must be called before the device request is made. It will not return a currently active device prompt.

:::

#### Signature:

```typescript
class Page &#123;abstract waitForDevicePrompt(options?: WaitTimeoutOptions): Promise<DeviceRequestPrompt>;&#125;
```

## Parameters

| Parameter | Type                                                    | Description  |
| --------- | ------------------------------------------------------- | ------------ |
| options   | [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md) | _(Optional)_ |

**Returns:**

Promise&lt;[DeviceRequestPrompt](./puppeteer.devicerequestprompt.md)&gt;

## Example

```ts
const [devicePrompt] = Promise.all([
  page.waitForDevicePrompt(),
  page.click('#connect-bluetooth'),
]);
await devicePrompt.select(
  await devicePrompt.waitForDevice((&#123;name&#125;) => name.includes('My Device'))
);
```
