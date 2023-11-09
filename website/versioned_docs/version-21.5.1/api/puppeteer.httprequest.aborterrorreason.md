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
