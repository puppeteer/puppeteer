---
sidebar_label: Page.workers
---

# Page.workers() method

### Signature:

```typescript
class Page {
  abstract workers(): WebWorker[];
}
```

All of the dedicated [WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) associated with the page.

**Returns:**

[WebWorker](./puppeteer.webworker.md)\[\]

## Remarks

This does not contain ServiceWorkers
