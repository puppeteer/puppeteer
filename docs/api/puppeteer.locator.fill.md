---
sidebar_label: Locator.fill
---

# Locator.fill() method

Fills out the input identified by the locator using the provided value. The type of the input is determined at runtime and the appropriate fill-out method is chosen based on the type. `contenteditable`, select, textarea and input elements are supported.

### Signature

```typescript
class Locator {
  fill<ElementType extends Element>(
    this: Locator<ElementType>,
    value: string,
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

value

</td><td>

string

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
