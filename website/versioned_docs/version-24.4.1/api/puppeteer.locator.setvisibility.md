---
sidebar_label: Locator.setVisibility
---

# Locator.setVisibility() method

Creates a new locator instance by cloning the current locator with the visibility property changed to the specified value.

### Signature

```typescript
class Locator {
  setVisibility<NodeType extends Node>(
    this: Locator<NodeType>,
    visibility: VisibilityOption,
  ): Locator<NodeType>;
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

[Locator](./puppeteer.locator.md)&lt;NodeType&gt;

</td><td>

</td></tr>
<tr><td>

visibility

</td><td>

[VisibilityOption](./puppeteer.visibilityoption.md)

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;NodeType&gt;
