---
sidebar_label: HTTPResponse.json
---

# HTTPResponse.json() method

**Signature:**

```typescript
class HTTPResponse {
  json(): Promise<any>;
}
```

**Returns:**

Promise&lt;any&gt;

Promise which resolves to a JSON representation of response body.

## Remarks

This method will throw if the response body is not parsable via `JSON.parse`.
