---
sidebar_label: JSHandle.getProperty
---

# JSHandle.getProperty() method

<h2 id="overload-1">getProperty(): Promise&lt;HandleFor&lt;T\[K\]&gt;&gt;</h2>

Fetches a single property from the referenced object.

### Signature

```typescript
class JSHandle {
  getProperty<K extends keyof T>(
    propertyName: HandleOr<K>,
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

<h2 id="overload-2">getProperty(): Promise&lt;JSHandle&lt;unknown&gt;&gt;</h2>

### Signature

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
