---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

Waits for the network to be idle.

#### Signature:

```typescript
class Page {
  waitForNetworkIdle(options?: WaitForNetworkIdleOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                  | Description                                         |
| --------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| options   | [WaitForNetworkIdleOptions](./puppeteer.waitfornetworkidleoptions.md) | _(Optional)_ Options to configure waiting behavior. |

**Returns:**

Promise&lt;void&gt;

A promise which resolves once the network is idle.
