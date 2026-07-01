---
sidebar_label: ConnectionClosedError
---

# ConnectionClosedError class

Thrown if underlying protocol connection has been closed.

### Signature

```typescript
export declare class ConnectionClosedError extends ProtocolError
```

**Extends:** [ProtocolError](./puppeteer.protocolerror.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

<span id="closecode">closeCode</span>

</td><td>

`readonly`

</td><td>

number \| undefined

</td><td>

WebSocket close code reported by the underlying transport if known.

</td></tr>
<tr><td>

<span id="closemessage">closeMessage</span>

</td><td>

`readonly`

</td><td>

string \| undefined

</td><td>

WebSocket close reason reported by the underlying transport if known.

</td></tr>
</tbody></table>