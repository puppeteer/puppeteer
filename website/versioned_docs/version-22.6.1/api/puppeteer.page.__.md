---
sidebar_label: Page.$$
---

# Page.$$() method

The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolves to `[]`.

#### Signature:

```typescript
class Page {
  $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>>;
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

A `selector` to query page for

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;

## Remarks

Shortcut for [Page.mainFrame().$$(selector)](./puppeteer.frame.__.md).
