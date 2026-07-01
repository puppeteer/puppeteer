---
sidebar_label: ConnectionCloseDetails
---

# ConnectionCloseDetails interface

Details provided by the underlying transport when it closes.

### Signature

```typescript
export interface ConnectionCloseDetails
```

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th><th>

Default

</th></tr></thead>
<tbody><tr><td>

<span id="closecode">closeCode</span>

</td><td>

`optional`

</td><td>

number

</td><td>

WebSocket close code reported by the underlying transport if known.

</td><td>

</td></tr>
<tr><td>

<span id="closemessage">closeMessage</span>

</td><td>

`optional`

</td><td>

string

</td><td>

WebSocket close reason reported by the underlying transport if known.

</td><td>

</td></tr>
</tbody></table>