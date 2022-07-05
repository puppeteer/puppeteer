---
sidebar_label: Frame.$$eval
---

# Frame.$$eval() method

**Signature:**

```typescript
class Frame {
  $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFunc<
      [Array<NodeFor<Selector>>, ...Params]
    > = EvaluateFunc<[Array<NodeFor<Selector>>, ...Params]>
  >(
    selector: Selector,
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

| Parameter    | Type           | Description                                               |
| ------------ | -------------- | --------------------------------------------------------- |
| selector     | Selector       | the selector to query for                                 |
| pageFunction | Func \| string | the function to be evaluated in the frame's context       |
| args         | Params         | additional arguments to pass to <code>pageFunction</code> |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

## Remarks

This method runs `Array.from(document.querySelectorAll(selector))` within the frame and passes it as the first argument to `pageFunction`.

If `pageFunction` returns a Promise, then `frame.$$eval` would wait for the promise to resolve and return its value.

## Example

```ts
const divsCounts = await frame.$$eval('div', divs => divs.length);
```
