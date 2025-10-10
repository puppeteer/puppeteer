---
sidebar_label: CommonEventEmitter.once
---

# CommonEventEmitter.once() method

### Signature

```typescript
interface CommonEventEmitter {
  once<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>,
  ): this;
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

handler

</td><td>

[Handler](./puppeteer.handler.md)&lt;Events\[Key\]&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

this
