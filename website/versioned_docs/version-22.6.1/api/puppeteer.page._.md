---
sidebar_label: Page.$
---

# Page.$() method

Runs `document.querySelector` within the page. If no element matches the selector, the return value resolves to `null`.

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

A `selector` to query page for [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to query page for.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;
