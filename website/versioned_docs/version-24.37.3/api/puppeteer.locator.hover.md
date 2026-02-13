---
sidebar_label: Locator.hover
---

# Locator.hover() method

Hovers over the located element.

### Signature

```typescript
class Locator {
  hover<ElementType extends Element>(
    this: Locator<ElementType>,
    options?: Readonly<ActionOptions>,
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

[Locator](./puppeteer.locator.md)&lt;ElementType&gt;

</td><td>

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[ActionOptions](./puppeteer.actionoptions.md)&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
