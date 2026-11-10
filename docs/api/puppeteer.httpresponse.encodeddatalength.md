---
sidebar_label: HTTPResponse.encodedDataLength
---

# HTTPResponse.encodedDataLength() method

Total number of bytes received for this request over the network.

### Signature

```typescript
class HTTPResponse {
  abstract encodedDataLength(): number;
}
```

**Returns:**

number

## Remarks

The value is updated when the response finishes loading. During the `response` event, it only covers the bytes received up to the response headers. To get the total encoded transfer size (headers + compressed body), read it in a `requestfinished` handler or after awaiting [HTTPResponse.content()](./puppeteer.httpresponse.content.md). If the request fails after the response is received, the value is not updated. If the browser does not report a size, e.g. for `data:` or `file:` URLs, the value is `0`.
