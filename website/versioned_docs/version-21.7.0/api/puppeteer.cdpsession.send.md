---
sidebar_label: CDPSession.send
---

# CDPSession.send() method

#### Signature:

```typescript
class CDPSession {
  abstract send<T extends keyof ProtocolMapping.Commands>(
    method: T,
    params?: ProtocolMapping.Commands[T]['paramsType'][0],
    options?: CommandOptions
  ): Promise<ProtocolMapping.Commands[T]['returnType']>;
}
```

## Parameters

| Parameter | Type                                               | Description  |
| --------- | -------------------------------------------------- | ------------ |
| method    | T                                                  |              |
| params    | ProtocolMapping.Commands\[T\]\['paramsType'\]\[0\] | _(Optional)_ |
| options   | [CommandOptions](./puppeteer.commandoptions.md)    | _(Optional)_ |

**Returns:**

Promise&lt;ProtocolMapping.Commands\[T\]\['returnType'\]&gt;
