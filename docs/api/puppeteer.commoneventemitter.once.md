---
sidebar_label: CommonEventEmitter.once
---

# CommonEventEmitter.once() method

#### Signature:

```typescript
interface CommonEventEmitter &#123;once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): this;&#125;
```

## Parameters

| Parameter | Type                                                   | Description |
| --------- | ------------------------------------------------------ | ----------- |
| type      | Key                                                    |             |
| handler   | [Handler](./puppeteer.handler.md)&lt;Events\[Key\]&gt; |             |

**Returns:**

this
