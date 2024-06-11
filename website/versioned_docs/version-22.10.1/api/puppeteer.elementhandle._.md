---
sidebar_label: ElementHandle.$
---

# ElementHandle.$() method

Queries the current element for an element matching the given selector.

#### Signature:

```typescript
class ElementHandle {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
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

The selector to query for.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

A [element handle](./puppeteer.elementhandle.md) to the first element matching the given selector. Otherwise, `null`.
