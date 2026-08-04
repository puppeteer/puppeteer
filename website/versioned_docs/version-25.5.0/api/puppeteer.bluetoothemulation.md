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

[Web Bluetooth specification](https://webbluetoothcg.github.io/web-bluetooth/#simulated-bluetooth-adapter) requires the emulated adapters should be isolated per top-level navigable. However, at the moment Chromium's bluetooth emulation implementation is tight to the browser context, not the page. This means the bluetooth emulation exposed from different pages of the same browser context would interfere their states.

## Example

```ts
await page.bluetooth.emulateAdapter('powered-on');
await page.bluetooth.simulatePreconnectedPeripheral({
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
await page.bluetooth.disableEmulation();
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

**_(Experimental)_** Disable emulated bluetooth adapter. See [bluetooth.disableSimulation](https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-disableSimulation-command).

</td></tr>
<tr><td>

<span id="emulateadapter">[emulateAdapter(state, leSupported)](./puppeteer.bluetoothemulation.emulateadapter.md)</span>

</td><td>

**_(Experimental)_** Emulate Bluetooth adapter. Required for bluetooth simulations See [bluetooth.simulateAdapter](https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateAdapter-command).

</td></tr>
<tr><td>

<span id="simulatepreconnectedperipheral">[simulatePreconnectedPeripheral(preconnectedPeripheral)](./puppeteer.bluetoothemulation.simulatepreconnectedperipheral.md)</span>

</td><td>

**_(Experimental)_** Simulated preconnected Bluetooth Peripheral. See [bluetooth.simulatePreconnectedPeripheral](https://webbluetoothcg.github.io/web-bluetooth/#bluetooth-simulateconnectedperipheral-command).

</td></tr>
</tbody></table>
