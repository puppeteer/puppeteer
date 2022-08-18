---
sidebar_label: ExecutionContext.evaluate
---

# ExecutionContext.evaluate() method

Evaluates the given function.

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

| Parameter    | Type           | Description                                     |
| ------------ | -------------- | ----------------------------------------------- |
| pageFunction | Func \| string | The function to evaluate.                       |
| args         | Params         | Additional arguments to pass into the function. |

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

The result of evaluating the function. If the result is an object, a vanilla object containing the serializable properties of the result is returned.

## Example 1

```ts
const executionContext = await page.mainFrame().executionContext();
const result = await executionContext.evaluate(() => Promise.resolve(8 * 7))* ;
console.log(result); // prints "56"
```

## Example 2

A string can also be passed in instead of a function:

```ts
console.log(await executionContext.evaluate('1 + 2')); // prints "3"
```

## Example 3

Handles can also be passed as `args`. They resolve to their referenced object:

```ts
const oneHandle = await executionContext.evaluateHandle(() => 1);
const twoHandle = await executionContext.evaluateHandle(() => 2);
const result = await executionContext.evaluate(
  (a, b) => a + b,
  oneHandle,
  twoHandle
);
await oneHandle.dispose();
await twoHandle.dispose();
console.log(result); // prints '3'.
```
