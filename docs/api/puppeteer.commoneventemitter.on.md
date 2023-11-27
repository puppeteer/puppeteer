---
sidebar_label: CommonEventEmitter.on
---

# CommonEventEmitter.on() method

#### Signature:

```typescript
interface CommonEventEmitter \{on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): this;\}
```

## Parameters

| Parameter | Type                                                   | Description |
| --------- | ------------------------------------------------------ | ----------- |
| type      | Key                                                    |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;Events\[Key\]&gt; |             |

**Returns:**

this
