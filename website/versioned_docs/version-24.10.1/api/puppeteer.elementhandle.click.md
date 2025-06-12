---
sidebar_label: ElementHandle.click
---

# ElementHandle.click() method

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to click in the center of the element. If the element is detached from DOM, the method throws an error.

### Signature

```typescript
class ElementHandle {
  click(
    this: ElementHandle<Element>,
    options?: Readonly<ClickOptions>,
  ): Promise<void>;
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

this

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
