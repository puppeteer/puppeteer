---
sidebar_label: Page.setBypassServiceWorker
---

# Page.setBypassServiceWorker() method

Toggles ignoring of service worker for each request.

#### Signature:

```typescript
class Page {
  abstract setBypassServiceWorker(bypass: boolean): Promise<void>;
}
```

## Parameters

| Parameter | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| bypass    | boolean | Whether to bypass service worker and load from network. |

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
