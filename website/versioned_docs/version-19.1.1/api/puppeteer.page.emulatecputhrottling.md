---
sidebar_label: Page.emulateCPUThrottling
---

# Page.emulateCPUThrottling() method

Enables CPU throttling to emulate slow CPUs.

#### Signature:

```typescript
class Page {
  emulateCPUThrottling(factor: number | null): Promise<void>;
}
```

## Parameters

| Parameter | Type           | Description                                                |
| --------- | -------------- | ---------------------------------------------------------- |
| factor    | number \| null | slowdown factor (1 is no throttle, 2 is 2x slowdown, etc). |

**Returns:**

Promise&lt;void&gt;
