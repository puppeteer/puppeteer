---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

#### Signature:

```typescript
class Page {
  abstract waitForNetworkIdle(options?: {
    idleTime?: number;
    timeout?: number;
  }): Promise<void>;
}
```

## Parameters

| Parameter | Type                                               | Description                              |
| --------- | -------------------------------------------------- | ---------------------------------------- |
| options   | &#123; idleTime?: number; timeout?: number; &#125; | _(Optional)_ Optional waiting parameters |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when network is idle
