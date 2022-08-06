---
sidebar_label: JSHandle.evaluate
---

# JSHandle.evaluate() method

This method passes this handle as the first argument to `pageFunction`. If `pageFunction` returns a Promise, then `handle.evaluate` would wait for the promise to resolve and return its value.

**Signature:**

```typescript
class JSHandle {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<[this, ...Params]> = EvaluateFunc<
      [this, ...Params]
    >
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

## Example

```ts
const tweetHandle = await page.$('.tweet .retweets');
expect(await tweetHandle.evaluate(node => node.innerText)).toBe('10');
```
