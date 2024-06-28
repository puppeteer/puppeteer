---
sidebar_label: JSHandle.jsonValue
---

# JSHandle.jsonValue() method

### Signature:

```typescript
class JSHandle {
  abstract jsonValue(): Promise<T>;
}
```

A vanilla object representing the serializable portions of the referenced object.

**Returns:**

Promise&lt;T&gt;

## Exceptions

Throws if the object cannot be serialized due to circularity.

## Remarks

If the object has a `toJSON` function, it **will not** be called.
