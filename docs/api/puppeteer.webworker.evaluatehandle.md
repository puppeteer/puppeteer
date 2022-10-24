---
sidebar_label: WebWorker.evaluateHandle
---

# WebWorker.evaluateHandle() method

The only difference between `worker.evaluate` and `worker.evaluateHandle` is that `worker.evaluateHandle` returns in-page object (JSHandle). If the function passed to the `worker.evaluateHandle` returns a `Promise`, then `worker.evaluateHandle` would wait for the promise to resolve and return its value. Shortcut for `await worker.executionContext()).evaluateHandle(pageFunction, ...args)`

#### Signature:

```typescript
class WebWorker {
  evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
}
```

## Parameters

| Parameter    | Type           | Description                                     |
| ------------ | -------------- | ----------------------------------------------- |
| pageFunction | Func \| string | Function to be evaluated in the page context.   |
| args         | Params         | Arguments to pass to <code>pageFunction</code>. |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

Promise which resolves to the return value of `pageFunction`.
