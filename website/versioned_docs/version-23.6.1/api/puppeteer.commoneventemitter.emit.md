---
sidebar_label: CommonEventEmitter.emit
---

# CommonEventEmitter.emit() method

### Signature

```typescript
interface CommonEventEmitter {
  emit<Key extends keyof Events>(type: Key, event: Events[Key]): boolean;
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

type

</td><td>

Key

</td><td>

</td></tr>
<tr><td>

event

</td><td>

Events\[Key\]

</td><td>

</td></tr>
</tbody></table>
**Returns:**

boolean
