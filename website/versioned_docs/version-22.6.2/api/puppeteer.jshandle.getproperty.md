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

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

propertyName

</td><td>

[HandleOr](./puppeteer.handleor.md)&lt;K&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;T\[K\]&gt;&gt;
