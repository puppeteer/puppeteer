---
sidebar_label: JSHandle.jsonValue
---

# JSHandle.jsonValue() method

**Signature:**

```typescript
class JSHandle {
  jsonValue(): Promise<T>;
}
```

**Returns:**

Promise&lt;T&gt;

A vanilla object representing the serializable portions of the referenced object.

## Exceptions

Throws if the object cannot be serialized due to circularity.

## Remarks

If the object has a `toJSON` function, it **will not** be called.
