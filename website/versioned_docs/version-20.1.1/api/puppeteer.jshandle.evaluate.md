---
sidebar_label: JSHandle.evaluate
---

# JSHandle.evaluate() method

Evaluates the given function with the current handle as its first argument.

#### Signature:

```typescript
class JSHandle {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFuncWith<T, Params> = EvaluateFuncWith<T, Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description |
| ------------ | -------------- | ----------- |
| pageFunction | Func \| string |             |
| args         | Params         |             |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;
