---
sidebar_label: Page.setBypassServiceWorker
---

# Page.setBypassServiceWorker() method

Toggles ignoring of service worker for each request.

#### Signature:

```typescript
class Page {
  setBypassServiceWorker(bypass: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| bypass    | boolean | Whether to bypass service worker and load from network. |

**Returns:**

Promise&lt;void&gt;
