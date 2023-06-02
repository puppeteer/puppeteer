---
sidebar_label: Locator.scroll
---

# Locator.scroll() method

#### Signature:

```typescript
class Locator {
  scroll(scrollOptions?: {
    scrollTop?: number;
    scrollLeft?: number;
    signal?: AbortSignal;
  }): Promise<void>;
}
```

## Parameters

| Parameter     | Type                                                               | Description  |
| ------------- | ------------------------------------------------------------------ | ------------ |
| scrollOptions | { scrollTop?: number; scrollLeft?: number; signal?: AbortSignal; } | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
