---
sidebar_label: JSHandle.getProperty
---

# JSHandle.getProperty() method

<h2 id="overload-0">getProperty&lt;K extends keyof T&gt;(propertyName: HandleOr&lt;K&gt;): Promise&lt;HandleFor&lt;T\[K\]&gt;&gt;;</h2>

### Signature:

```typescript
class JSHandle {
  getProperty<K extends keyof T>(
    propertyName: HandleOr<K>
  ): Promise<HandleFor<T[K]>>;
}
```

Fetches a single property from the referenced object.

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

<h2 id="overload-1">getProperty(propertyName: string): Promise&lt;JSHandle&lt;unknown&gt;&gt;;</h2>

### Signature:

```typescript
class JSHandle {
  getProperty(propertyName: string): Promise<JSHandle<unknown>>;
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

string

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[JSHandle](./puppeteer.jshandle.md)&lt;unknown&gt;&gt;
