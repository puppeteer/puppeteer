---
sidebar_label: Frame.waitForDevicePrompt
---

# Frame.waitForDevicePrompt() method

This method is typically coupled with an action that triggers a device request from an api such as WebBluetooth.

:::caution

This must be called before the device request is made. It will not return a currently active device prompt.

:::

#### Signature:

```typescript
class Frame {
  waitForDevicePrompt(
    options?: WaitTimeoutOptions
  ): Promise<DeviceRequestPrompt>;
}
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
  frame.waitForDevicePrompt(),
  frame.click('#connect-bluetooth'),
]);
await devicePrompt.select(
  await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
);
```
