---
sidebar_label: ElementHandle.dragAndDrop
---

# ElementHandle.dragAndDrop() method

> Warning: This API is now obsolete.
>
> Use `ElementHandle.drop` instead.

### Signature

```typescript
class ElementHandle {
  dragAndDrop(
    this: ElementHandle<Element>,
    target: ElementHandle<Node>,
    options?: {
      delay: number;
    },
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

target

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;

</td><td>

</td></tr>
<tr><td>

options

</td><td>

&#123; delay: number; &#125;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
