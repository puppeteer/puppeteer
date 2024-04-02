---
sidebar_label: HTTPRequest.finalizeInterceptions
---

# HTTPRequest.finalizeInterceptions() method

Awaits pending interception handlers and then decides how to fulfill the request interception.

#### Signature:

```typescript
class HTTPRequest {
  finalizeInterceptions(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;
