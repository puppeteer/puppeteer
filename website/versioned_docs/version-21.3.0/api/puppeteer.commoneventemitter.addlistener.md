---
sidebar_label: CommonEventEmitter.addListener
---

# CommonEventEmitter.addListener() method

#### Signature:

```typescript
interface CommonEventEmitter {
  addListener<Key extends keyof Events>(
    type: Key,
    handler: Handler<Events[Key]>
  ): this;
}
```

## Parameters

| Parameter | Type                                                   | Description |
| --------- | ------------------------------------------------------ | ----------- |
| type      | Key                                                    |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;Events\[Key\]&gt; |             |

**Returns:**

this
