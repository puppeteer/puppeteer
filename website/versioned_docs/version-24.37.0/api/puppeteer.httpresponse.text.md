---
sidebar_label: HTTPResponse.text
---

# HTTPResponse.text() method

Promise which resolves to a text (utf8) representation of response body.

### Signature

```typescript
class HTTPResponse {
  text(): Promise<string>;
}
```

**Returns:**

Promise&lt;string&gt;

## Remarks

This method will throw if the content is not utf-8 string
