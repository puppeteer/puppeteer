---
sidebar_label: JSHandle.jsonValue
---

# JSHandle.jsonValue() method

A vanilla object representing the serializable portions of the referenced object.

#### Signature:

```typescript
class JSHandle {
  abstract jsonValue(): Promise<T>;
}
```

**Returns:**

Promise&lt;T&gt;

## Exceptions

Throws if the object cannot be serialized due to circularity.

## Remarks

If the object has a `toJSON` function, it **will not** be called.
