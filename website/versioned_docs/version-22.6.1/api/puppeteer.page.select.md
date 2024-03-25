---
sidebar_label: Page.select
---

# Page.select() method

Triggers a `change` and `input` event once all the provided options have been selected. If there's no `<select>` element matching `selector`, the method throws an error.

#### Signature:

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

A [Selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to query the page for

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
