---
sidebar_label: HTTPRequest.failure
---

# HTTPRequest.failure() method

Access information about the request's failure.

### Signature

```typescript
class HTTPRequest {
  abstract failure(): {
    errorText: string;
  } | null;
}
```

**Returns:**

&#123; errorText: string; &#125; \| null

`null` unless the request failed. If the request fails this can return an object with `errorText` containing a human-readable error message, e.g. `net::ERR_FAILED`. It is not guaranteed that there will be failure text if the request fails.

## Remarks

## Example

Example of logging all failed requests:

```ts
page.on('requestfailed', request => {
  console.log(request.url() + ' ' + request.failure().errorText);
});
```
