---
sidebar_label: HTTPRequest.asFetchRequest
---

# HTTPRequest.asFetchRequest() method

Converts the request to a Fetch API Request instance.

### Signature

```typescript
class HTTPRequest {
  asFetchRequest(): Promise<Request>;
}
```

**Returns:**

Promise&lt;Request&gt;

A promise which resolves to a Fetch API Request object.

## Remarks

Headers are copied to the new Request instance, with multi-line `cookie` headers parsed into individual header entries. The request URL and method are preserved. The body is built from [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md) when available, otherwise the Request is created without a body. For `GET` and `HEAD` requests the body is always omitted, as required by the Fetch API.
