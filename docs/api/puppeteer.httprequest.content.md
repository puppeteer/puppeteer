---
sidebar_label: HTTPRequest.content
---

# HTTPRequest.content() method

Fetches the POST data for the request from the browser as a `Uint8Array`.

### Signature

```typescript
class HTTPRequest {
  content(): Promise<Uint8Array | undefined>;
}
```

**Returns:**

Promise&lt;Uint8Array \| undefined&gt;

A promise that resolves to the raw POST data bytes, or `undefined` when the request has no POST data or it is not available.
