---
sidebar_label: Page.worker
---

# Page.worker() method

Gets a worker with the given URL.

#### Signature:

```typescript
class Page {
  worker(url: string, options?: WaitForTargetOptions): Promise<WebWorker>;
}
```

## Parameters

| Parameter | Type                                                        | Description                                 |
| --------- | ----------------------------------------------------------- | ------------------------------------------- |
| url       | string                                                      | The URL associated with the desired worker. |
| options   | [WaitForTargetOptions](./puppeteer.waitfortargetoptions.md) | _(Optional)_ Configures waiting behavior.   |

**Returns:**

Promise&lt;[WebWorker](./puppeteer.webworker.md)&gt;

## Exceptions

An error if waiting times out.
