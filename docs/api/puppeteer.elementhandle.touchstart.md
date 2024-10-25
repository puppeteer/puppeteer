---
sidebar_label: ElementHandle.touchStart
---

# ElementHandle.touchStart() method

This method scrolls the element into view if needed, and then starts a touch in the center of the element.

### Signature

```typescript
class ElementHandle {
  touchStart(this: ElementHandle<Element>): Promise<TouchHandle>;
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
</tbody></table>
**Returns:**

Promise&lt;[TouchHandle](./puppeteer.touchhandle.md)&gt;

A [TouchHandle](./puppeteer.touchhandle.md) representing the touch that was started
