---
sidebar_label: ElementHandle.dragEnter
---

# ElementHandle.dragEnter() method

### Signature:

```typescript
class ElementHandle {
  dragEnter(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
}
```

> Warning: This API is now obsolete.
>
> Do not use. `dragenter` will automatically be performed during dragging.

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

data

</td><td>

Protocol.Input.DragData

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
