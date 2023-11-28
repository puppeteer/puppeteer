---
sidebar_label: DeviceRequestPrompt
---

# DeviceRequestPrompt class

Device request prompts let you respond to the page requesting for a device through an API like WebBluetooth.

#### Signature:

```typescript
export declare class DeviceRequestPrompt
```

## Remarks

`DeviceRequestPrompt` instances are returned via the [Page.waitForDevicePrompt()](./puppeteer.page.waitfordeviceprompt.md) method.

The constructor for this class is marked as internal. Third-party code should not call the constructor directly or create subclasses that extend the `DeviceRequestPrompt` class.

## Example

```ts
const [deviceRequest] = Promise.all([
  page.waitForDevicePrompt(),
  page.click('#connect-bluetooth'),
]);
await devicePrompt.select(
  await devicePrompt.waitForDevice(({name}) => name.includes('My Device'))
);
```

## Properties

| Property | Modifiers | Type                                                                      | Description                         |
| -------- | --------- | ------------------------------------------------------------------------- | ----------------------------------- |
| devices  |           | [DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)\[\] | Current list of selectable devices. |

## Methods

| Method                                                                             | Modifiers | Description                                                  |
| ---------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| [cancel()](./puppeteer.devicerequestprompt.cancel.md)                              |           | Cancel the prompt.                                           |
| [select(device)](./puppeteer.devicerequestprompt.select.md)                        |           | Select a device in the prompt's list.                        |
| [waitForDevice(filter, options)](./puppeteer.devicerequestprompt.waitfordevice.md) |           | Resolve to the first device in the prompt matching a filter. |
