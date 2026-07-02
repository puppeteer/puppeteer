---
sidebar_label: HTTPResponse.headers
---

# HTTPResponse.headers() method

An object with HTTP headers associated with the response. All header names are lower-case. Duplicate header values are combined into a single comma-separated list except for `Set-Cookie` that is separated by `\n`.

### Signature

```typescript
class HTTPResponse {
  abstract headers(): Record<string, string>;
}
```

**Returns:**

Record&lt;string, string&gt;
