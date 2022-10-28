---
sidebar_label: Frame.evaluate
---

# Frame.evaluate() method

Behaves identically to [Page.evaluate()](./puppeteer.page.evaluate.md) except it's run within the the context of this frame.

#### Signature:

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

| Parameter    | Type           | Description |
| ------------ | -------------- | ----------- |
| pageFunction | Func \| string |             |
| args         | Params         |             |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;
