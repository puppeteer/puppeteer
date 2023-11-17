---
sidebar_label: HTTPRequest.finalizeInterceptions
---

# HTTPRequest.finalizeInterceptions() method

Awaits pending interception handlers and then decides how to fulfill the request interception.

#### Signature:

```typescript
class HTTPRequest {
  abstract finalizeInterceptions(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
