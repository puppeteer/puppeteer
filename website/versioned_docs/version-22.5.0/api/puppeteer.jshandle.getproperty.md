---
sidebar_label: JSHandle.getProperty
---

# JSHandle.getProperty() method

Fetches a single property from the referenced object.

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
