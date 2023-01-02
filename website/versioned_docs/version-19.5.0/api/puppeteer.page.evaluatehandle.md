---
sidebar_label: Page.evaluateHandle
---

# Page.evaluateHandle() method

#### Signature:

```typescript
class Page {
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

| Parameter    | Type           | Description                                |
| ------------ | -------------- | ------------------------------------------ |
| pageFunction | Func \| string | a function that is run within the page     |
| args         | Params         | arguments to be passed to the pageFunction |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

## Remarks

The only difference between [page.evaluate](./puppeteer.page.evaluate.md) and `page.evaluateHandle` is that `evaluateHandle` will return the value wrapped in an in-page object.

If the function passed to `page.evaluateHandle` returns a Promise, the function will wait for the promise to resolve and return its value.

You can pass a string instead of a function (although functions are recommended as they are easier to debug and use with TypeScript):

## Example 1

```ts
const aHandle = await page.evaluateHandle('document');
```

## Example 2

[JSHandle](./puppeteer.jshandle.md) instances can be passed as arguments to the `pageFunction`:

```ts
const aHandle = await page.evaluateHandle(() => document.body);
const resultHandle = await page.evaluateHandle(body => body.innerHTML, aHandle);
console.log(await resultHandle.jsonValue());
await resultHandle.dispose();
```

Most of the time this function returns a [JSHandle](./puppeteer.jshandle.md), but if `pageFunction` returns a reference to an element, you instead get an [ElementHandle](./puppeteer.elementhandle.md) back:

## Example 3

```ts
const button = await page.evaluateHandle(() =>
  document.querySelector('button')
);
// can call `click` because `button` is an `ElementHandle`
await button.click();
```

The TypeScript definitions assume that `evaluateHandle` returns a `JSHandle`, but if you know it's going to return an `ElementHandle`, pass it as the generic argument:

```ts
const button = await page.evaluateHandle<ElementHandle>(...);
```
