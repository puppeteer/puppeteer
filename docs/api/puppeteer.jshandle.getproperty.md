---
sidebar_label: JSHandle.getProperty
---

# JSHandle.getProperty() method

Fetches a single property from the referenced object.

#### Signature:

```typescript
class JSHandle {
  getProperty(propertyName: string): Promise<JSHandle<unknown>>;
}
```

## Parameters

| Parameter    | Type   | Description |
| ------------ | ------ | ----------- |
| propertyName | string |             |

**Returns:**

Promise&lt;[JSHandle](./puppeteer.jshandle.md)&lt;unknown&gt;&gt;
