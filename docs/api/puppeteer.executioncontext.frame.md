---
sidebar_label: ExecutionContext.frame
---

# ExecutionContext.frame() method

**Signature:**

```typescript
class ExecutionContext {
  frame(): Frame | null;
}
```

**Returns:**

[Frame](./puppeteer.frame.md) \| null

The frame associated with this execution context.

## Remarks

Not every execution context is associated with a frame. For example, workers and extensions have execution contexts that are not associated with frames.
