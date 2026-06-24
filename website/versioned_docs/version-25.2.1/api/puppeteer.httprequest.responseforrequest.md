---
sidebar_label: HTTPRequest.responseForRequest
---

# HTTPRequest.responseForRequest() method

The `ResponseForRequest` that gets used if the interception is allowed to respond (ie, `abort()` is not called).

### Signature

```typescript
class HTTPRequest {
  responseForRequest(): Partial<ResponseForRequest> | null;
}
```

**Returns:**

Partial&lt;[ResponseForRequest](./puppeteer.responseforrequest.md)&gt; \| null
