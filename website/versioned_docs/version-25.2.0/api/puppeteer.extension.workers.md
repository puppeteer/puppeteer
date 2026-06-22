---
sidebar_label: Extension.workers
---

# Extension.workers() method

Returns a list of the currently active service workers belonging to the extension.

### Signature

```typescript
class Extension {
  abstract workers(): Promise<WebWorker[]>;
}
```

**Returns:**

Promise&lt;[WebWorker](./puppeteer.webworker.md)\[\]&gt;
