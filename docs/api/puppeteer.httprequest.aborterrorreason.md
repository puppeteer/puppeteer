---
sidebar_label: HTTPRequest.abortErrorReason
---

# HTTPRequest.abortErrorReason() method

The most recent reason for aborting the request

#### Signature:

```typescript
class HTTPRequest {
  abstract abortErrorReason(): Protocol.Network.ErrorReason | null;
}
```

**Returns:**

Protocol.Network.ErrorReason \| null

## Remarks

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).
