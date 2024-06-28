---
sidebar_label: HTTPRequest.finalizeInterceptions
---

# HTTPRequest.finalizeInterceptions() method

### Signature:

```typescript
class HTTPRequest {
  finalizeInterceptions(): Promise<void>;
}
```

Awaits pending interception handlers and then decides how to fulfill the request interception.

**Returns:**

Promise&lt;void&gt;
