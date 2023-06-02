---
sidebar_label: Locator.fill
---

# Locator.fill() method

Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. contenteditable, selector, inputs are supported.

#### Signature:

```typescript
class Locator {
  fill(
    value: string,
    fillOptions?: {
      signal?: AbortSignal;
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter   | Type                      | Description  |
| ----------- | ------------------------- | ------------ |
| value       | string                    |              |
| fillOptions | { signal?: AbortSignal; } | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
