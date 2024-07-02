---
sidebar_label: Connection.session
---

# Connection.session() method

#### Signature:

```typescript
class Connection {
  session(sessionId: string): CDPSession | null;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

sessionId

</td><td>

string

</td><td>

The session id

</td></tr>
</tbody></table>
**Returns:**

[CDPSession](./puppeteer.cdpsession.md) \| null

The current CDP session if it exists
