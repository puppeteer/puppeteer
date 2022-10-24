---
sidebar_label: Tracing.stop
---

# Tracing.stop() method

Stops a trace started with the `start` method.

#### Signature:

```typescript
class Tracing {
  stop(): Promise<Buffer | undefined>;
}
```

**Returns:**

Promise&lt;Buffer \| undefined&gt;

Promise which resolves to buffer with trace data.
