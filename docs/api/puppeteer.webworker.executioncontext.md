---
sidebar_label: WebWorker.executionContext
---

# WebWorker.executionContext() method

Returns the ExecutionContext the WebWorker runs in

**Signature:**

```typescript
class WebWorker {
  executionContext(): Promise<ExecutionContext>;
}
```

**Returns:**

Promise&lt;[ExecutionContext](./puppeteer.executioncontext.md)&gt;

The ExecutionContext the web worker runs in.
