---
sidebar_label: Frame.$eval
---

# Frame.$eval() method

Runs the given function on the first element matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

#### Signature:

```typescript
class Frame {
  $eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<NodeFor<Selector>, Params> = EvaluateFuncWith<
      NodeFor<Selector>,
      Params
    >
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description                                                                                                                                        |
| ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector     | Selector       | The selector to query for.                                                                                                                         |
| pageFunction | Func \| string | The function to be evaluated in the frame's context. The first element matching the selector will be passed to the function as its first argument. |
| args         | Params         | Additional arguments to pass to <code>pageFunction</code>.                                                                                         |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

A promise to the result of the function.

## Example

```ts
const searchValue = await frame.$eval('#search', el => el.value);
```
