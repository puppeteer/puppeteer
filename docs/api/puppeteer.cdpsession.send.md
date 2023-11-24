---
sidebar_label: CDPSession.send
---

# CDPSession.send() method

#### Signature:

```typescript
class CDPSession &#123;abstract send<T extends keyof ProtocolMapping.Commands>(method: T, ...paramArgs: ProtocolMapping.Commands[T]['paramsType']): Promise<ProtocolMapping.Commands[T]['returnType']>;&#125;
```

## Parameters

| Parameter | Type                                          | Description |
| --------- | --------------------------------------------- | ----------- |
| method    | T                                             |             |
| paramArgs | ProtocolMapping.Commands\[T\]\['paramsType'\] |             |

**Returns:**

Promise&lt;ProtocolMapping.Commands\[T\]\['returnType'\]&gt;
