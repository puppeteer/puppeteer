---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

**Signature:**

```typescript
class Page {
  waitForNetworkIdle(options?: {
    idleTime?: number;
    timeout?: number;
  }): Promise<void>;
}
```

## Parameters

| Parameter        | Type                                     | Description                                                        |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| options          | { idleTime?: number; timeout?: number; } | <i>(Optional)</i> Optional waiting parameters                      |
| options.idleTime | number                                   | The duration of network idling in milliseconds in order to resolve |
| options.timeout  | number                                   | Maximum waiting time in milliseconds                               |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the network remains idle. When the `timeout` is reached and the network has not reached idle, the promise is rejected.
