---
sidebar_label: CDPSession.detach
---

# CDPSession.detach() method

### Signature:

```typescript
class CDPSession {
  abstract detach(): Promise<void>;
}
```

Detaches the cdpSession from the target. Once detached, the cdpSession object won't emit any events and can't be used to send messages.

**Returns:**

Promise&lt;void&gt;
