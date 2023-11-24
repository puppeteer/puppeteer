---
sidebar_label: Tracing.stop
---

# Tracing.stop() method

Stops a trace started with the `start` method.

#### Signature:

```typescript
class Tracing &#123;stop(): Promise<Buffer | undefined>;&#125;
```

**Returns:**

Promise&lt;Buffer \| undefined&gt;

Promise which resolves to buffer with trace data.
