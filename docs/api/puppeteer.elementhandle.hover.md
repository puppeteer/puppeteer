---
sidebar_label: ElementHandle.hover
---

# ElementHandle.hover() method

### Signature:

```typescript
class ElementHandle {
  hover(this: ElementHandle<Element>): Promise<void>;
}
```

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to hover over the center of the element. If the element is detached from DOM, the method throws an error.

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

this

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
