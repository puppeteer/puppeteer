---
sidebar_label: BluetoothEmulation.emulateAdapter
---

# BluetoothEmulation.emulateAdapter() method

Emulate Bluetooth adapter. Required for bluetooth simulations See [bluetooth.simulateAdapter](https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateAdapter-command).

### Signature

```typescript
interface BluetoothEmulation {
  emulateAdapter(state: AdapterState, leSupported?: boolean): Promise<void>;
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

state

</td><td>

[AdapterState](./puppeteer.adapterstate.md)

</td><td>

The desired bluetooth adapter state.

</td></tr>
<tr><td>

leSupported

</td><td>

boolean

</td><td>

_(Optional)_ Mark if the adapter supports low-energy bluetooth.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
