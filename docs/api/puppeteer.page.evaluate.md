---
sidebar_label: Page.evaluate
---

# Page.evaluate() method

Evaluates a function in the page's context and returns the result.

If the function passed to `page.evaluate` returns a Promise, the function will wait for the promise to resolve and return its value.

### Signature

```typescript
class Page {
  evaluate<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    ...args: Params
  ): Promise<Awaited<ReturnType<Func>>>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

pageFunction

</td><td>

Func \| string

</td><td>

a function that is run within the page

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

arguments to be passed to the pageFunction

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

the return value of `pageFunction`.

## Example 1

```ts
const result = await frame.evaluate(() => {
  return Promise.resolve(8 * 7);
});
console.log(result); // prints "56"
```

You can pass a string instead of a function (although functions are recommended as they are easier to debug and use with TypeScript):

## Example 2

```ts
const aHandle = await page.evaluate('1 + 2');
```

To get the best TypeScript experience, you should pass in as the generic the type of `pageFunction`:

```ts
const aHandle = await page.evaluate(() => 2);
```

## Example 3

[ElementHandle](./puppeteer.elementhandle.md) instances (including [JSHandle](./puppeteer.jshandle.md)s) can be passed as arguments to the `pageFunction`:

```ts
const bodyHandle = await page.$('body');
const html = await page.evaluate(body => body.innerHTML, bodyHandle);
await bodyHandle.dispose();
```
