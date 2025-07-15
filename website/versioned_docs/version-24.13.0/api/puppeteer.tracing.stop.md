---
sidebar_label: Tracing.stop
---

# Tracing.stop() method

Stops a trace started with the `start` method.

### Signature

```typescript
class Tracing {
  stop(): Promise<Uint8Array | undefined>;
}
```

**Returns:**

Promise&lt;Uint8Array \| undefined&gt;

Promise which resolves to buffer with trace data.
