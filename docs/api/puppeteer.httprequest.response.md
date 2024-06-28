---
sidebar_label: HTTPRequest.response
---

# HTTPRequest.response() method

### Signature:

```typescript
class HTTPRequest {
  abstract response(): HTTPResponse | null;
}
```

A matching `HTTPResponse` object, or null if the response has not been received yet.

**Returns:**

[HTTPResponse](./puppeteer.httpresponse.md) \| null
