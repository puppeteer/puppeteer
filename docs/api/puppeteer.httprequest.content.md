---
sidebar_label: HTTPRequest.content
---

# HTTPRequest.content() method

Fetches the POST data for the request from the browser as a `Uint8Array`.

### Signature

```typescript
class HTTPRequest {
  abstract content(): Promise<Uint8Array<ArrayBuffer> | undefined>;
}
```

**Returns:**

Promise&lt;Uint8Array&lt;ArrayBuffer&gt; \| undefined&gt;

A promise that resolves to the raw POST data bytes, or `undefined` when the request has no POST data or fetching it fails.

## Remarks

If the request has no POST data or fetching the POST data from the browser fails, this method resolves to `undefined`.
