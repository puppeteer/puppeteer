---
sidebar_label: JSHandle.evaluateHandle
---

# JSHandle.evaluateHandle() method

This method passes this handle as the first argument to `pageFunction`.

**Signature:**

```typescript
class JSHandle {
  evaluateHandle<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
}
```

## Parameters

| Parameter    | Type           | Description |
| ------------ | -------------- | ----------- |
| pageFunction | Func \| string |             |
| args         | Params         |             |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

## Remarks

The only difference between `jsHandle.evaluate` and `jsHandle.evaluateHandle` is that `jsHandle.evaluateHandle` returns an in-page object (JSHandle).

If the function passed to `jsHandle.evaluateHandle` returns a Promise, then `evaluateHandle.evaluateHandle` waits for the promise to resolve and returns its value.

See [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) for more details.
