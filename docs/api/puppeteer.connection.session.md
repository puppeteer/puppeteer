---
sidebar_label: Connection.session
---

# Connection.session() method

#### Signature:

```typescript
class Connection &#123;session(sessionId: string): CDPSession | null;&#125;
```

## Parameters

| Parameter | Type   | Description    |
| --------- | ------ | -------------- |
| sessionId | string | The session id |

**Returns:**

[CDPSession](./puppeteer.cdpsession.md) \| null

The current CDP session if it exists
