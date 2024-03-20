---
sidebar_label: Connection.createSession
---

# Connection.createSession() method

#### Signature:

```typescript
class Connection {
  createSession(targetInfo: Protocol.Target.TargetInfo): Promise<CDPSession>;
}
```

## Parameters

| Parameter  | Type                       | Description     |
| ---------- | -------------------------- | --------------- |
| targetInfo | Protocol.Target.TargetInfo | The target info |

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;

The CDP session that is created
