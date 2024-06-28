---
sidebar_label: ElementHandle.dragOver
---

# ElementHandle.dragOver() method

### Signature:

```typescript
class ElementHandle {
  dragOver(
    this: ElementHandle<Element>,
    data?: Protocol.Input.DragData
  ): Promise<void>;
}
```

> Warning: This API is now obsolete.
>
> Do not use. `dragover` will automatically be performed during dragging.

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
