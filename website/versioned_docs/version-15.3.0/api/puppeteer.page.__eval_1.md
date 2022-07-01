---
sidebar_label: Page.$$eval_1
---

# Page.$$eval() method

**Signature:**

```typescript
class Page {
  $$eval<
    Params extends unknown[],
    Func extends EvaluateFunc<[Element[], ...Params]> = EvaluateFunc<
      [Element[], ...Params]
    >
  >(
    selector: string,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description |
| ------------ | -------------- | ----------- |
| selector     | string         |             |
| pageFunction | Func \| string |             |
| args         | Params         |             |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;
