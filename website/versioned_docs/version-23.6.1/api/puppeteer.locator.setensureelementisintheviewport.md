---
sidebar_label: Locator.setEnsureElementIsInTheViewport
---

# Locator.setEnsureElementIsInTheViewport() method

Creates a new locator instance by cloning the current locator and specifying whether the locator should scroll the element into viewport if it is not in the viewport already.

### Signature

```typescript
class Locator {
  setEnsureElementIsInTheViewport<ElementType extends Element>(
    this: Locator<ElementType>,
    value: boolean,
  ): Locator<ElementType>;
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

value

</td><td>

boolean

</td><td>

</td></tr>
</tbody></table>
**Returns:**

[Locator](./puppeteer.locator.md)&lt;ElementType&gt;

#### Default value:

`true`
