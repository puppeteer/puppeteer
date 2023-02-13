---
sidebar_label: JSHandle.getProperty_2
---

# JSHandle.getProperty() method

#### Signature:

```typescript
class JSHandle {
  getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
}
```

## Parameters

| Parameter    | Type                                         | Description |
| ------------ | -------------------------------------------- | ----------- |
| propertyName | [HandleOr](./puppeteer.handleor.md)&lt;K&gt; |             |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;T\[K\]&gt;&gt;
