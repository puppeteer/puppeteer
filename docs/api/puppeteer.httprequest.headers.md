---
sidebar_label: HTTPRequest.headers
---

# HTTPRequest.headers() method

### Signature:

```typescript
class HTTPRequest {
  abstract headers(): Record<string, string>;
}
```

An object with HTTP headers associated with the request. All header names are lower-case.

**Returns:**

Record&lt;string, string&gt;
