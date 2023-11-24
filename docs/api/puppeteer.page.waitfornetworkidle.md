---
sidebar_label: Page.waitForNetworkIdle
---

# Page.waitForNetworkIdle() method

#### Signature:

```typescript
class Page &#123;abstract waitForNetworkIdle(options?: &#123;
        idleTime?: number;
        timeout?: number;
    &#125;): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                               | Description                              |
| --------- | -------------------------------------------------- | ---------------------------------------- |
| options   | &#123; idleTime?: number; timeout?: number; &#125; | _(Optional)_ Optional waiting parameters |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when network is idle
