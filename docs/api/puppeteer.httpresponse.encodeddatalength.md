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

When accessed during the `response` event (before the response body has finished loading), this reflects the bytes received up to the response headers. Once the request finishes loading, it reflects the total encoded transfer size (headers + compressed body).
