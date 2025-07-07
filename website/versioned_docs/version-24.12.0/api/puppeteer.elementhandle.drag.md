---
sidebar_label: ElementHandle.drag
---

# ElementHandle.drag() method

Drags an element over the given element or point.

### Signature

```typescript
class ElementHandle {
  drag(
    this: ElementHandle<Element>,
    target: Point | ElementHandle<Element>,
  ): Promise<Protocol.Input.DragData | void>;
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

[Point](./puppeteer.point.md) \| [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Protocol.Input.DragData \| void&gt;

DEPRECATED. When drag interception is enabled, the drag payload is returned.
