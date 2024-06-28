---
sidebar_label: Tracing.stop
---

# Tracing.stop() method

### Signature:

```typescript
class Tracing {
  stop(): Promise<Buffer | undefined>;
}
```

Stops a trace started with the `start` method.

**Returns:**

Promise&lt;Buffer \| undefined&gt;

Promise which resolves to buffer with trace data.
