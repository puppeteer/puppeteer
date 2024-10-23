---
sidebar_label: Page.$$eval
---

# Page.$$eval() method

This method returns all elements matching the selector and passes the resulting array as the first argument to the `pageFunction`.

### Signature

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

[selector](https://pptr.dev/guides/page-interactions#selectors) to query the page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax).

</td></tr>
<tr><td>

pageFunction

</td><td>

Func \| string

</td><td>

the function to be evaluated in the page context. Will be passed an array of matching elements as its first argument.

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
  elements.map(e => e.textContent),
);
```
