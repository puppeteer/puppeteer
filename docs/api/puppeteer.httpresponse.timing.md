---
sidebar_label: HTTPResponse.timing
---

# HTTPResponse.timing() method

Timing information related to the response.

### Signature

```typescript
class HTTPResponse {
  abstract timing(): Protocol.Network.ResourceTiming | null;
}
```

**Returns:**

Protocol.Network.ResourceTiming \| null

## Remarks

The returned `ResourceTiming` fields follow the Chrome DevTools Protocol: all timing values except `requestTime` are measured in milliseconds relative to `requestTime`. To calculate time to first byte (TTFB) for this response, use `receiveHeadersStart`.

## Example

```ts
const response = await page.goto('https://example.com');
const timing = response?.timing();
if (timing) {
  const ttfb = timing.receiveHeadersStart;
  console.log(`TTFB: ${ttfb}ms`);
}
```
