---
sidebar_label: Connection.createSession
---

# Connection.createSession() method

#### Signature:

```typescript
class Connection &#123;createSession(targetInfo: Protocol.Target.TargetInfo): Promise<CDPSession>;&#125;
```

## Parameters

| Parameter  | Type                       | Description     |
| ---------- | -------------------------- | --------------- |
| targetInfo | Protocol.Target.TargetInfo | The target info |

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;

The CDP session that is created
