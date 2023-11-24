---
sidebar_label: HTTPRequest.finalizeInterceptions
---

# HTTPRequest.finalizeInterceptions() method

Awaits pending interception handlers and then decides how to fulfill the request interception.

#### Signature:

```typescript
class HTTPRequest &#123;abstract finalizeInterceptions(): Promise<void>;&#125;
```

**Returns:**

Promise&lt;void&gt;
