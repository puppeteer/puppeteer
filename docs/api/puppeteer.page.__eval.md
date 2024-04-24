---
sidebar_label: Page.$$eval
---

# Page.$$eval() method

This method runs `Array.from(document.querySelectorAll(selector))` within the page and passes the result as the first argument to the `pageFunction`.

#### Signature:

```typescript
class Page {
  $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<
      Array<NodeFor<Selector>>,
      Params
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>,
  >(
    selector: Selector,
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

selector

</td><td>

Selector

</td><td>

the [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to query for

</td></tr>
<tr><td>

pageFunction

</td><td>

Func \| string

</td><td>

the function to be evaluated in the page context. Will be passed the result of `Array.from(document.querySelectorAll(selector))` as its first argument.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

any additional arguments to pass through to `pageFunction`.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

The result of calling `pageFunction`. If it returns an element it is wrapped in an [ElementHandle](./puppeteer.elementhandle.md), else the raw value itself is returned.

## Remarks

If `pageFunction` returns a promise `$$eval` will wait for the promise to resolve and then return its value.

## Example 1

```ts
// get the amount of divs on the page
const divCount = await page.$$eval('div', divs => divs.length);

// get the text content of all the `.options` elements:
const options = await page.$$eval('div > span.options', options => {
  return options.map(option => option.textContent);
});
```

If you are using TypeScript, you may have to provide an explicit type to the first argument of the `pageFunction`. By default it is typed as `Element[]`, but you may need to provide a more specific sub-type:

## Example 2

```ts
await page.$$eval('input', elements => {
  return elements.map(e => e.value);
});
```

The compiler should be able to infer the return type from the `pageFunction` you provide. If it is unable to, you can use the generic type to tell the compiler what return type you expect from `$$eval`:

## Example 3

```ts
const allInputValues = await page.$$eval('input', elements =>
  elements.map(e => e.textContent)
);
```
