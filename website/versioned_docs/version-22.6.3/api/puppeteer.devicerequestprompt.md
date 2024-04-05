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

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

devices

</td><td>

</td><td>

[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)\[\]

</td><td>

Current list of selectable devices.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

[cancel()](./puppeteer.devicerequestprompt.cancel.md)

</td><td>

</td><td>

Cancel the prompt.

</td></tr>
<tr><td>

[select(device)](./puppeteer.devicerequestprompt.select.md)

</td><td>

</td><td>

Select a device in the prompt's list.

</td></tr>
<tr><td>

[waitForDevice(filter, options)](./puppeteer.devicerequestprompt.waitfordevice.md)

</td><td>

</td><td>

Resolve to the first device in the prompt matching a filter.

</td></tr>
</tbody></table>
