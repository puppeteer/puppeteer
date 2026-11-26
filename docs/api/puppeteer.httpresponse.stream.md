---
sidebar_label: HTTPResponse.stream
---

# HTTPResponse.stream() method

Returns the response body as a stream of chunks as they arrive from the network.

### Signature

```typescript
class HTTPResponse {
  abstract stream(): Promise<ReadableStream<Uint8Array>>;
}
```

**Returns:**

Promise&lt;ReadableStream&lt;Uint8Array&gt;&gt;

## Remarks

Call this from the [response](./puppeteer.pageevent.md) event to receive the body while it is still loading. If the body has already finished loading, the stream contains the whole body as a single chunk.
