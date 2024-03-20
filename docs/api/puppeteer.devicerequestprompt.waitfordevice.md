---
sidebar_label: DeviceRequestPrompt.waitForDevice
---

# DeviceRequestPrompt.waitForDevice() method

Resolve to the first device in the prompt matching a filter.

#### Signature:

```typescript
class DeviceRequestPrompt {
  waitForDevice(
    filter: (device: DeviceRequestPromptDevice) => boolean,
    options?: WaitTimeoutOptions
  ): Promise<DeviceRequestPromptDevice>;
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

filter

</td><td>

(device: [DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)) =&gt; boolean

</td><td>

</td></tr>
<tr><td>

options

</td><td>

[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)&gt;
