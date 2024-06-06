---
sidebar_label: ElementHandle.$$s
---

# ElementHandle.$$s() method

Same as [ElementHandle.$$()](./puppeteer.elementhandle.__.md) and offers better performance when returning many elements but does not run the query in isolation from the page DOM.

#### Signature:

```typescript
class ElementHandle {
  $$s<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>>;
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

selector

</td><td>

Selector

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;
