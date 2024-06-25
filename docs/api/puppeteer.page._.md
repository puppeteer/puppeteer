---
sidebar_label: Page.$
---

# Page.$() method

Finds the first element that matches the selector. If no element matches the selector, the return value resolves to `null`.

#### Signature:

```typescript
class Page {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
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

[selector](https://pptr.dev/guides/page-interactions#selectors) to query page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax).

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

## Remarks

Shortcut for [Page.mainFrame().$(selector)](./puppeteer.frame._.md).
