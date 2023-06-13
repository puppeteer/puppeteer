---
sidebar_label: Connection.send
---

# Connection.send() method

#### Signature:

```typescript
class Connection {
  send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    ...paramArgs: ProtocolMapping.Commands[T]['paramsType']
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
}
```

## Parameters

| Parameter | Type                                          | Description |
| --------- | --------------------------------------------- | ----------- |
| method    | T                                             |             |
| paramArgs | ProtocolMapping.Commands\[T\]\['paramsType'\] |             |

**Returns:**

Promise&lt;ProtocolMapping.Commands\[T\]\['returnType'\]&gt;
