---
sidebar_label: CommonEventEmitter.off
---

# CommonEventEmitter.off() method

#### Signature:

```typescript
interface CommonEventEmitter \{off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): this;\}
```

## Parameters

| Parameter | Type                                                   | Description  |
| --------- | ------------------------------------------------------ | ------------ |
| type      | Key                                                    |              |
| handler   | [Handler](./puppeteer.handler.md)&lt;Events\[Key\]&gt; | _(Optional)_ |

**Returns:**

this
