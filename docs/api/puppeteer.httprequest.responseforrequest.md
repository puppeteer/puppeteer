---
sidebar_label: HTTPRequest.responseForRequest
---

# HTTPRequest.responseForRequest() method

The `ResponseForRequest` that gets used if the interception is allowed to respond (ie, `abort()` is not called).

#### Signature:

```typescript
class HTTPRequest &#123;abstract responseForRequest(): Partial<ResponseForRequest> | null;&#125;
```

**Returns:**

Partial&lt;[ResponseForRequest](./puppeteer.responseforrequest.md)&gt; \| null
