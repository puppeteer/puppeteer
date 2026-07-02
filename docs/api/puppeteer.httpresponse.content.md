---
sidebar_label: HTTPResponse.content
---

# HTTPResponse.content() method

Promise which resolves to a buffer with response body.

### Signature

```typescript
class HTTPResponse {
  abstract content(): Promise<Uint8Array>;
}
```

**Returns:**

Promise&lt;Uint8Array&gt;

## Remarks

The buffer might be re-encoded by the browser based on HTTP-headers or other heuristics. If the browser failed to detect the correct encoding, the buffer might be encoded incorrectly. See https://github.com/puppeteer/puppeteer/issues/6478.
