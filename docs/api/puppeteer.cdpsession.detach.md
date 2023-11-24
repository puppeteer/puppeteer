---
sidebar_label: CDPSession.detach
---

# CDPSession.detach() method

Detaches the cdpSession from the target. Once detached, the cdpSession object won't emit any events and can't be used to send messages.

#### Signature:

```typescript
class CDPSession &#123;abstract detach(): Promise<void>;&#125;
```

**Returns:**

Promise&lt;void&gt;
