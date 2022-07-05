---
sidebar_label: Frame.evaluate
---

# Frame.evaluate() method

**Signature:**

```typescript
class Frame {
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

| Parameter    | Type           | Description                                |
| ------------ | -------------- | ------------------------------------------ |
| pageFunction | Func \| string | a function that is run within the frame    |
| args         | Params         | arguments to be passed to the pageFunction |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

## Remarks

This method behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the context of the `frame`, rather than the entire page.
