---
sidebar_label: HTTPResponse.asFetchResponse
---

# HTTPResponse.asFetchResponse() method

Converts the response to a Fetch API Response instance.

### Signature

```typescript
class HTTPResponse {
  asFetchResponse(): Promise<Response>;
}
```

**Returns:**

Promise&lt;Response&gt;

A promise which resolves to a Fetch API Response object.

## Remarks

Headers are copied to the new Response instance, with multi-line `set-cookie` headers parsed into individual header entries. For responses with null body statuses (101, 204, 205, 304), the body is omitted.
