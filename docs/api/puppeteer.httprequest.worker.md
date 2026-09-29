---
sidebar_label: HTTPRequest.worker
---

# HTTPRequest.worker() method

The worker that initiated the request, or null if navigating to error pages or the request is coming from a page.

### Signature

```typescript
class HTTPRequest {
  abstract worker(): WebWorker | null;
}
```

**Returns:**

[WebWorker](./puppeteer.webworker.md) \| null
