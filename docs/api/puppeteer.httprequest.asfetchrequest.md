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

Headers are copied to the new Request instance. The request URL and method are preserved. The body is built from [HTTPRequest.fetchPostData()](./puppeteer.httprequest.fetchpostdata.md) when the request has post data, otherwise the Request is created without a body. For `GET` and `HEAD` requests the body is always omitted, as required by the Fetch API.
