---
sidebar_label: ExecutionContext.evaluateHandle
---

# ExecutionContext.evaluateHandle() method

**Signature:**

```typescript
class ExecutionContext {
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

| Parameter    | Type           | Description                                                     |
| ------------ | -------------- | --------------------------------------------------------------- |
| pageFunction | Func \| string | a function to be evaluated in the <code>executionContext</code> |
| args         | Params         | argument to pass to the page function                           |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A promise that resolves to the return value of the given function as an in-page object (a [JSHandle](./puppeteer.jshandle.md)).

## Remarks

The only difference between `executionContext.evaluate` and `executionContext.evaluateHandle` is that `executionContext.evaluateHandle` returns an in-page object (a [JSHandle](./puppeteer.jshandle.md)). If the function passed to the `executionContext.evaluateHandle` returns a Promise, then `executionContext.evaluateHandle` would wait for the promise to resolve and return its value.

## Example 1

```ts
const context = await page.mainFrame().executionContext();
const aHandle = await context.evaluateHandle(() => Promise.resolve(self));
aHandle; // Handle for the global object.
```

## Example 2

A string can also be passed in instead of a function.

```ts
// Handle for the '3' * object.
const aHandle = await context.evaluateHandle('1 + 2');
```

## Example 3

JSHandle instances can be passed as arguments to the `executionContext.* evaluateHandle`:

```ts
const aHandle = await context.evaluateHandle(() => document.body);
const resultHandle = await context.evaluateHandle(body => body.innerHTML, * aHandle);
console.log(await resultHandle.jsonValue()); // prints body's innerHTML
await aHandle.dispose();
await resultHandle.dispose();
```
