---
sidebar_label: ConsoleMessage.worker
---

# ConsoleMessage.worker() method

The [WebWorker](./puppeteer.webworker.md) that initiated the console message, or `null` if the message originated from a frame.

### Signature

```typescript
class ConsoleMessage {
  worker(): WebWorker | null;
}
```

**Returns:**

[WebWorker](./puppeteer.webworker.md) \| null
