---
sidebar_label: Connection.createSession
---

# Connection.createSession() method

### Signature

```typescript
class Connection {
  createSession(targetInfo: Protocol.Target.TargetInfo): Promise<CDPSession>;
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

targetInfo

</td><td>

Protocol.Target.TargetInfo

</td><td>

The target info

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[CDPSession](./puppeteer.cdpsession.md)&gt;

The CDP session that is created
