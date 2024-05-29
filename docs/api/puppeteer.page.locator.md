---
sidebar_label: Page.locator
---

# Page.locator() method

Creates a locator for the provided selector. See [Locator](./puppeteer.locator.md) for details and supported actions.

#### Signature:

```typescript
class Page {
  locator<Selector extends string>(
    selector: Selector
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

[selector](https://pptr.dev/guides/page-interactions#query-selectors) to query page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific seletor syntax](https://pptr.dev/guides/page-interactions#p-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#-and--combinators). Alternatively, you can specify a selector type using a prefix [prefix](https://pptr.dev/guides/page-interactions#built-in-selectors).

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;

## Remarks

Locators API is experimental and we will not follow semver for breaking change in the Locators API.
