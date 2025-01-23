---
sidebar_label: Target.worker
---

# Target.worker() method

If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.

### Signature

```typescript
class Target {
  worker(): Promise<WebWorker | null>;
}
```

**Returns:**

Promise&lt;[WebWorker](./puppeteer.webworker.md) \| null&gt;
