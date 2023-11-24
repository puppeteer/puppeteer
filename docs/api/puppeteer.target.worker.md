---
sidebar_label: Target.worker
---

# Target.worker() method

If the target is not of type `"service_worker"` or `"shared_worker"`, returns `null`.

#### Signature:

```typescript
class Target &#123;worker(): Promise<WebWorker | null>;&#125;
```

**Returns:**

Promise&lt;[WebWorker](./puppeteer.webworker.md) \| null&gt;
