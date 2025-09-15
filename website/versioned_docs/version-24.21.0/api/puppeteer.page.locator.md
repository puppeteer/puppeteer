---
sidebar_label: Page.locator
---

# Page.locator() method

<h2 id="overload-1">locator(): Locator&lt;NodeFor&lt;Selector&gt;&gt;</h2>

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

### Signature

```typescript
class Page {
  locator<Selector extends string>(
    selector: Selector,
  ): Locator<NodeFor<Selector>>;
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

[selector](https://pptr.dev/guides/page-interactions#selectors) to query the page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows querying by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax).

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;

<h2 id="overload-2">locator(): Locator&lt;Ret&gt;</h2>

Creates a locator for the provided function. See [Locator](./puppeteer.locator.md) for details and supported actions.

### Signature

```typescript
class Page {
  locator<Ret>(func: () => Awaitable<Ret>): Locator<Ret>;
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

func

</td><td>

() =&gt; [Awaitable](./puppeteer.awaitable.md)&lt;Ret&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;Ret&gt;
