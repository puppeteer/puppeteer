---
sidebar_label: WebWorker.evaluate
---

# WebWorker.evaluate() method

If the function passed to the `worker.evaluate` returns a Promise, then `worker.evaluate` would wait for the promise to resolve and return its value. If the function passed to the `worker.evaluate` returns a non-serializable value, then `worker.evaluate` resolves to `undefined`. DevTools Protocol also supports transferring some additional values that are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and bigint literals. Shortcut for `await worker.executionContext()).evaluate(pageFunction, ...args)`.

#### Signature:

```typescript
class WebWorker {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description                                     |
| ------------ | -------------- | ----------------------------------------------- |
| pageFunction | Func \| string | Function to be evaluated in the worker context. |
| args         | Params         | Arguments to pass to <code>pageFunction</code>. |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

Promise which resolves to the return value of `pageFunction`.
