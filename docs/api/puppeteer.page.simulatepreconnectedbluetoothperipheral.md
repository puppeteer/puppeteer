---
sidebar_label: Page.simulatePreconnectedBluetoothPeripheral
---

# Page.simulatePreconnectedBluetoothPeripheral() method

Simulated preconnected Bluetooth Peripheral. https://webbluetoothcg.github.io/web-bluetooth/\#bluetooth-simulateconnectedperipheral-command

### Signature

```typescript
class Page {
  abstract simulatePreconnectedBluetoothPeripheral(
    peripheral: PreconnectedBluetoothPeripheral,
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

peripheral

</td><td>

PreconnectedBluetoothPeripheral

</td><td>

The peripheral to simulate.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
