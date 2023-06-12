---
sidebar_label: Locator.wait
---

# Locator.wait() method

Waits for an element to be located.

#### Signature:

```typescript
class Locator {
  abstract wait(waitOptions?: {signal?: AbortSignal}): Promise<void>;
}
```

## Parameters

| Parameter   | Type                      | Description  |
| ----------- | ------------------------- | ------------ |
| waitOptions | { signal?: AbortSignal; } | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
