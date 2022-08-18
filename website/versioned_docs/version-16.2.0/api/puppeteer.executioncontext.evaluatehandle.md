---
sidebar_label: ExecutionContext.evaluateHandle
---

# ExecutionContext.evaluateHandle() method

Evaluates the given function.

Unlike [evaluate](./puppeteer.executioncontext.evaluate.md), this method returns a handle to the result of the function.

This method may be better suited if the object cannot be serialized (e.g. `Map`) and requires further manipulation.

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

| Parameter    | Type           | Description                                     |
| ------------ | -------------- | ----------------------------------------------- |
| pageFunction | Func \| string | The function to evaluate.                       |
| args         | Params         | Additional arguments to pass into the function. |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A [handle](./puppeteer.jshandle.md) to the result of evaluating the function. If the result is a `Node`, then this will return an [element handle](./puppeteer.elementhandle.md).

## Example 1

```ts
const context = await page.mainFrame().executionContext();
const handle: JSHandle<typeof globalThis> = await context.evaluateHandle(() =>
  Promise.resolve(self)
);
```

## Example 2

A string can also be passed in instead of a function.

```ts
const handle: JSHandle<number> = await context.evaluateHandle('1 + 2');
```

## Example 3

Handles can also be passed as `args`. They resolve to their referenced object:

```ts
const bodyHandle: ElementHandle<HTMLBodyElement> = await context.evaluateHandle(
  () => {
    return document.body;
  }
);
const stringHandle: JSHandle<string> = await context.evaluateHandle(
  body => body.innerHTML,
  body
);
console.log(await stringHandle.jsonValue()); // prints body's innerHTML
// Always dispose your garbage! :)
await bodyHandle.dispose();
await stringHandle.dispose();
```
