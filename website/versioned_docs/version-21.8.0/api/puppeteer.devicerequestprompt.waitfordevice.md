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

| Parameter | Type                                                                                          | Description  |
| --------- | --------------------------------------------------------------------------------------------- | ------------ |
| filter    | (device: [DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)) =&gt; boolean |              |
| options   | [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)                                       | _(Optional)_ |

**Returns:**

Promise&lt;[DeviceRequestPromptDevice](./puppeteer.devicerequestpromptdevice.md)&gt;
