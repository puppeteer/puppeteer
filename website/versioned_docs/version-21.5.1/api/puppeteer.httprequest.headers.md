---
sidebar_label: HTTPRequest.headers
---

# HTTPRequest.headers() method

An object with HTTP headers associated with the request. All header names are lower-case.

#### Signature:

```typescript
class HTTPRequest {
  abstract headers(): Record<string, string>;
}
```

**Returns:**

Record&lt;string, string&gt;
