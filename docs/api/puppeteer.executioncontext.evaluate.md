---
sidebar_label: ExecutionContext.evaluate
---

# ExecutionContext.evaluate() method

**Signature:**

```typescript
class ExecutionContext {
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

| Parameter    | Type           | Description                                                     |
| ------------ | -------------- | --------------------------------------------------------------- |
| pageFunction | Func \| string | a function to be evaluated in the <code>executionContext</code> |
| args         | Params         | argument to pass to the page function                           |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

A promise that resolves to the return value of the given function.

## Remarks

If the function passed to the `executionContext.evaluate` returns a Promise, then `executionContext.evaluate` would wait for the promise to resolve and return its value. If the function passed to the `executionContext.evaluate` returns a non-serializable value, then `executionContext.evaluate` resolves to `undefined`. DevTools Protocol also supports transferring some additional values that are not serializable by `JSON`: `-0`, `NaN`, `Infinity`, `-Infinity`, and bigint literals.

## Example 1

```ts
const executionContext = await page.mainFrame().executionContext();
const result = await executionContext.evaluate(() => Promise.resolve(8 * 7))* ;
console.log(result); // prints "56"
```

## Example 2

A string can also be passed in instead of a function.

```ts
console.log(await executionContext.evaluate('1 + 2')); // prints "3"
```

## Example 3

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the `executionContext.* evaluate`:

```ts
const oneHandle = await executionContext.evaluateHandle(() => 1);
const twoHandle = await executionContext.evaluateHandle(() => 2);
const result = await executionContext.evaluate(
   (a, b) => a + b, oneHandle, * twoHandle
);
await oneHandle.dispose();
await twoHandle.dispose();
console.log(result); // prints '3'.
```
