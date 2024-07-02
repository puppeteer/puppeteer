---
sidebar_label: HTTPResponse.buffer
---

# HTTPResponse.buffer() method

Promise which resolves to a buffer with response body.

#### Signature:

```typescript
class HTTPResponse {
  abstract buffer(): Promise<Buffer>;
}
```

**Returns:**

Promise&lt;Buffer&gt;

## Remarks

The buffer might be re-encoded by the browser based on HTTP-headers or other heuristics. If the browser failed to detect the correct encoding, the buffer might be encoded incorrectly. See https://github.com/puppeteer/puppeteer/issues/6478.
