---
sidebar_label: BluetoothEmulation.simulatePreconnectedPeripheral
---

# BluetoothEmulation.simulatePreconnectedPeripheral() method

Simulated preconnected Bluetooth Peripheral. See [bluetooth.simulatePreconnectedPeripheral](https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateconnectedperipheral-command).

### Signature

```typescript
interface BluetoothEmulation {
  simulatePreconnectedPeripheral(
    preconnectedPeripheral: PreconnectedPeripheral,
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

preconnectedPeripheral

</td><td>

[PreconnectedPeripheral](./puppeteer.preconnectedperipheral.md)

</td><td>

The peripheral to simulate.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
