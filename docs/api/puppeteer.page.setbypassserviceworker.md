---
sidebar_label: Page.setBypassServiceWorker
---

# Page.setBypassServiceWorker() method

Toggles ignoring of service worker for each request.

#### Signature:

```typescript
class Page &#123;abstract setBypassServiceWorker(bypass: boolean): Promise<void>;&#125;
```

## Parameters

| Parameter | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| bypass    | boolean | Whether to bypass service worker and load from network. |

**Returns:**

Promise&lt;void&gt;
