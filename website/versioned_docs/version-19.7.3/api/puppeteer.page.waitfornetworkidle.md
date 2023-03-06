---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

#### Signature:

```typescript
class Page {
  waitForNetworkIdle(options?: {
    idleTime?: number;
    timeout?: number;
  }): Promise<void>;
}
```

## Parameters

| Parameter | Type                                     | Description                              |
| --------- | ---------------------------------------- | ---------------------------------------- |
| options   | { idleTime?: number; timeout?: number; } | _(Optional)_ Optional waiting parameters |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when network is idle
