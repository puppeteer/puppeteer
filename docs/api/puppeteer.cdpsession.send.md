---
sidebar_label: CDPSession.send
---

# CDPSession.send() method

#### Signature:

```typescript
class CDPSession {
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
