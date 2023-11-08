---
sidebar_label: Page.workers
---

# Page.workers() method

All of the dedicated [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) associated with the page.

#### Signature:

```typescript
class Page {
  abstract workers(): WebWorker[];
}
```

**Returns:**

[WebWorker](./puppeteer.webworker.md)\[\]

## Remarks

This does not contain ServiceWorkers
