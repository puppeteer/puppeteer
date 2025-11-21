---
sidebar_label: Page.simulateBluetoothAdapter
---

# Page.simulateBluetoothAdapter() method

Simulate Bluetooth adapter. https://webbluetoothcg.github.io/web-bluetooth/\#bluetooth-simulateAdapter-command

### Signature

```typescript
class Page {
  abstract simulateBluetoothAdapter(
    state: BluetoothAdapterState,
    leSupported?: boolean,
  ): Promise<void>;
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

BluetoothAdapterState

</td><td>

The desired bluetooth adapter state.

</td></tr>
<tr><td>

leSupported

</td><td>

boolean

</td><td>

_(Optional)_ Mark if the adapter supports BLE.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
