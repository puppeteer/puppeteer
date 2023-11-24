---
sidebar_label: HTTPResponse.json
---

# HTTPResponse.json() method

Promise which resolves to a JSON representation of response body.

#### Signature:

```typescript
class HTTPResponse &#123;json(): Promise<any>;&#125;
```

**Returns:**

Promise&lt;any&gt;

## Remarks

This method will throw if the response body is not parsable via `JSON.parse`.
