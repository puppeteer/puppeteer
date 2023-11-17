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

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
