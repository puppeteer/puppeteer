---
sidebar_label: Frame.evaluateHandle
---

# Frame.evaluateHandle() method

**Signature:**

```typescript
class Frame {
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

| Parameter    | Type           | Description                                |
| ------------ | -------------- | ------------------------------------------ |
| pageFunction | Func \| string | a function that is run within the frame    |
| args         | Params         | arguments to be passed to the pageFunction |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

## Remarks

The only difference between [Frame.evaluate()](./puppeteer.frame.evaluate.md) and `frame.evaluateHandle` is that `evaluateHandle` will return the value wrapped in an in-page object.

This method behaves identically to [Page.evaluateHandle()](./puppeteer.page.evaluatehandle.md) except it's run within the context of the `frame`, rather than the entire page.
