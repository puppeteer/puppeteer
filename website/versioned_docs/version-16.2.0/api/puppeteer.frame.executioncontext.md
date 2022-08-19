---
sidebar_label: Frame.executionContext
---

# Frame.executionContext() method

> Warning: This API is now obsolete.
>
> Do not use the execution context directly.

**Signature:**

```typescript
class Frame {
  executionContext(): Promise<ExecutionContext>;
}
```

**Returns:**

Promise&lt;[ExecutionContext](./puppeteer.executioncontext.md)&gt;

a promise that resolves to the frame's default execution context.
