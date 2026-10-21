---
sidebar_label: HTTPRequest.headers
---

# HTTPRequest.headers() method

An object with HTTP headers associated with the request. All header names are lower-case.

### Signature

```typescript
class HTTPRequest {
  abstract headers(): Record<string, string>;
}
```

**Returns:**

Record&lt;string, string&gt;

## Remarks

Under CDP, `page.on('request')` fires before the browser's network stack attaches all headers (such as `accept`, `accept-encoding`, `cookie`, `host`, and `sec-fetch-*`). The full set of headers is populated asynchronously and is available by the time `page.on('response')` or `page.on('requestfinished')` fires.
