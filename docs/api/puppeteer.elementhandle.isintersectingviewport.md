---
sidebar_label: ElementHandle.isIntersectingViewport
---

# ElementHandle.isIntersectingViewport() method

Resolves to true if the element is visible in the current viewport.

**Signature:**

```typescript
class ElementHandle {
  isIntersectingViewport(options?: {threshold?: number}): Promise<boolean>;
}
```

## Parameters

| Parameter | Type                    | Description       |
| --------- | ----------------------- | ----------------- |
| options   | { threshold?: number; } | <i>(Optional)</i> |

**Returns:**

Promise&lt;boolean&gt;
