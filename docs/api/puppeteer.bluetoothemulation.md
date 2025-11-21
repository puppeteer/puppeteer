---
sidebar_label: BluetoothEmulation
---

# BluetoothEmulation interface

Exposes the bluetooth emulation abilities.

### Signature

```typescript
export interface BluetoothEmulation
```

## Remarks

## Example

```ts
await page.bluetoothEmulation.emulateAdapter('powered-on');
await page.bluetoothEmulation.simulatePreconnectedPeripheral({
  address: '09:09:09:09:09:09',
  name: 'SOME_NAME',
  manufacturerData: [
    {
      key: 17,
      data: 'AP8BAX8=',
    },
  ],
  knownServiceUuids: ['12345678-1234-5678-9abc-def123456789'],
});
await page.bluetoothEmulation.disableEmulation();
```

## Methods

<table><thead><tr><th>

Method

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="disableemulation">[disableEmulation()](./puppeteer.bluetoothemulation.disableemulation.md)</span>

</td><td>

**_(Experimental)_** Disable emulated bluetooth adapter. https://webbluetoothcg.github.io/web-bluetooth/\#bluetooth-disableSimulation-command

</td></tr>
<tr><td>

<span id="emulateadapter">[emulateAdapter(state, leSupported)](./puppeteer.bluetoothemulation.emulateadapter.md)</span>

</td><td>

**_(Experimental)_** Emulate Bluetooth adapter. Required for bluetooth simulations https://webbluetoothcg.github.io/web-bluetooth/\#bluetooth-simulateAdapter-command

</td></tr>
<tr><td>

<span id="simulatepreconnectedperipheral">[simulatePreconnectedPeripheral(preconnectedPeripheral)](./puppeteer.bluetoothemulation.simulatepreconnectedperipheral.md)</span>

</td><td>

**_(Experimental)_** Simulated preconnected Bluetooth Peripheral. https://webbluetoothcg.github.io/web-bluetooth/\#bluetooth-simulateconnectedperipheral-command

</td></tr>
</tbody></table>
