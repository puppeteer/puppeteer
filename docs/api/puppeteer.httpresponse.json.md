---
sidebar_label: HTTPResponse.json
---

# HTTPResponse.json() method

### Signature:

```typescript
class HTTPResponse {
  json(): Promise<any>;
}
```

Promise which resolves to a JSON representation of response body.

**Returns:**

Promise&lt;any&gt;

## Remarks

This method will throw if the response body is not parsable via `JSON.parse`.
