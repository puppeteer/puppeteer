---
sidebar_label: Page.focus
---

# Page.focus() method

This method fetches an element with `selector` and focuses it. If there's no element matching `selector`, the method throws an error.

### Signature

```typescript
class Page {
  focus(selector: string): Promise<void>;
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

string

</td><td>

[selector](https://pptr.dev/guides/page-interactions#selectors) to query the page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows querying by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax). If there are multiple elements satisfying the selector, the first will be focused.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the element matching selector is successfully focused. The promise will be rejected if there is no element matching selector.

## Remarks

Shortcut for [page.mainFrame().focus(selector)](./puppeteer.frame.focus.md).
