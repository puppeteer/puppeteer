---
sidebar_label: ElementHandle.touchMove
---

# ElementHandle.touchMove() method

This method scrolls the element into view if needed, and then moves the touch to the center of the element.

### Signature

```typescript
class ElementHandle {
  touchMove(this: ElementHandle<Element>, touch?: TouchHandle): Promise<void>;
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

touch

</td><td>

[TouchHandle](./puppeteer.touchhandle.md)

</td><td>

_(Optional)_ An optional [TouchHandle](./puppeteer.touchhandle.md). If provided, this touch will be moved. If not provided, the first active touch will be moved.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
