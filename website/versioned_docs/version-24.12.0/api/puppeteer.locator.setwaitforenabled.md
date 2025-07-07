---
sidebar_label: Locator.setWaitForEnabled
---

# Locator.setWaitForEnabled() method

Creates a new locator instance by cloning the current locator and specifying whether to wait for input elements to become enabled before the action. Applicable to `click` and `fill` actions.

### Signature

```typescript
class Locator {
  setWaitForEnabled<NodeType extends Node>(
    this: Locator<NodeType>,
    value: boolean,
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

value

</td><td>

boolean

</td><td>

</td></tr>
</tbody></table>

**Returns:**

[Locator](./puppeteer.locator.md)&lt;NodeType&gt;

#### Default value:

`true`
