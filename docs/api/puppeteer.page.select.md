---
sidebar_label: Page.select
---

# Page.select() method

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

### Signature

```typescript
class Page {
  select(selector: string, ...values: string[]): Promise<string[]>;
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

[selector](https://pptr.dev/guides/page-interactions#selectors) to query the page for. [CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) can be passed as-is and a [Puppeteer-specific selector syntax](https://pptr.dev/guides/page-interactions#non-css-selectors) allows quering by [text](https://pptr.dev/guides/page-interactions#text-selectors--p-text), [a11y role and name](https://pptr.dev/guides/page-interactions#aria-selectors--p-aria), and [xpath](https://pptr.dev/guides/page-interactions#xpath-selectors--p-xpath) and [combining these queries across shadow roots](https://pptr.dev/guides/page-interactions#querying-elements-in-shadow-dom). Alternatively, you can specify the selector type using a [prefix](https://pptr.dev/guides/page-interactions#prefixed-selector-syntax).

</td></tr>
<tr><td>

values

</td><td>

string\[\]

</td><td>

Values of options to select. If the `<select>` has the `multiple` attribute, all values are considered, otherwise only the first one is taken into account.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;string\[\]&gt;

## Remarks

Shortcut for [page.mainFrame().select()](./puppeteer.frame.select.md)

## Example

```ts
page.select('select#colors', 'blue'); // single selection
page.select('select#colors', 'red', 'green', 'blue'); // multiple selections
```
