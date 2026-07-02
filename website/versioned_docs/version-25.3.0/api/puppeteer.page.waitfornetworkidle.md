---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

Waits for the network to be idle.

### Signature

```typescript
class Page {
  waitForNetworkIdle(options?: WaitForNetworkIdleOptions): Promise<void>;
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

options

</td><td>

[WaitForNetworkIdleOptions](./puppeteer.waitfornetworkidleoptions.md)

</td><td>

_(Optional)_ Options to configure waiting behavior.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

A promise which resolves once the network is idle.

## Remarks

The function will always wait at least the set [IdleTime](./puppeteer.waitfornetworkidleoptions.md#idletime).
