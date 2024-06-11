---
sidebar_label: Frame.$$eval
---

# Frame.$$eval() method

Runs the given function on an array of elements matching the given selector in the frame.

If the given function returns a promise, then this method will wait till the promise resolves.

#### Signature:

```typescript
class Frame {
  $$eval<
    Selector extends string,
    Params extends unknown[],
    Func extends EvaluateFuncWith<
      Array<NodeFor<Selector>>,
      Params
    > = EvaluateFuncWith<Array<NodeFor<Selector>>, Params>,
  >(
    selector: Selector,
    pageFunction: string | Func,
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

[selector](https://pptr.dev/guides/page-interactions#query-selectors) to query page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific seletor syntax](https://pptr.dev/guides/page-interactions#p-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#-and--combinators). Alternatively, you can specify a selector type using a prefix [prefix](https://pptr.dev/guides/page-interactions#built-in-selectors).

</td></tr>
<tr><td>

pageFunction

</td><td>

string \| Func

</td><td>

The function to be evaluated in the frame's context. An array of elements matching the given selector will be passed to the function as its first argument.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

Additional arguments to pass to `pageFunction`.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;

A promise to the result of the function.

## Example

```ts
const divsCounts = await frame.$$eval('div', divs => divs.length);
```
