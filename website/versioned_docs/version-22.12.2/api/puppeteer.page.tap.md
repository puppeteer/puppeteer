---
sidebar_label: Page.tap
---

# Page.tap() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.md#touchscreen) to tap in the center of the element. If there's no element matching `selector`, the method throws an error.

#### Signature:

```typescript
class Page {
  tap(selector: string): Promise<void>;
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

A [Selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

Shortcut for [page.mainFrame().tap(selector)](./puppeteer.frame.tap.md).
