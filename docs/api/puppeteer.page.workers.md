---
sidebar_label: Page.workers
---

# Page.workers() method

#### Signature:

```typescript
class Page {
  workers(): WebWorker[];
}
```

**Returns:**

[WebWorker](./puppeteer.webworker.md)\[\]

all of the dedicated [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) associated with the page.

## Remarks

This does not contain ServiceWorkers
