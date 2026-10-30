---
sidebar_label: HTTPRequest.worker
---

# HTTPRequest.worker() method

The worker that initiated the request, or null if the request was not initiated by a worker.

### Signature

```typescript
class HTTPRequest {
  abstract worker(): WebWorker | null;
}
```

**Returns:**

[WebWorker](./puppeteer.webworker.md) \| null
