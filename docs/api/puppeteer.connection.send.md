---
sidebar_label: Connection.send
---

# Connection.send() method

### Signature

```typescript
class Connection {
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params?: ProtocolMapping.Commands[T]['paramsType'][0],
    options?: CommandOptions,
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
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

method

</td><td>

T

</td><td>

</td></tr>
<tr><td>

params

</td><td>

ProtocolMapping.Commands\[T\]\['paramsType'\]\[0\]

</td><td>

_(Optional)_

</td></tr>
<tr><td>

options

</td><td>

[CommandOptions](./puppeteer.commandoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;ProtocolMapping.Commands\[T\]\['returnType'\]&gt;
