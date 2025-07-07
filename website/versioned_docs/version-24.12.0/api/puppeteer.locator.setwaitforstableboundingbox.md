---
sidebar_label: Locator.setWaitForStableBoundingBox
---

# Locator.setWaitForStableBoundingBox() method

Creates a new locator instance by cloning the current locator and specifying whether the locator has to wait for the element's bounding box to be same between two consecutive animation frames.

### Signature

```typescript
class Locator {
  setWaitForStableBoundingBox<ElementType extends Element>(
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
