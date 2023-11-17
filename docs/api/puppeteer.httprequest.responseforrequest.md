---
sidebar_label: HTTPRequest.responseForRequest
---

# HTTPRequest.responseForRequest() method

The `ResponseForRequest` that gets used if the interception is allowed to respond (ie, `abort()` is not called).

#### Signature:

```typescript
class HTTPRequest {
  abstract responseForRequest(): Partial<ResponseForRequest> | null;
}
```

**Returns:**

Partial&lt;[ResponseForRequest](./puppeteer.responseforrequest.md)&gt; \| null

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
