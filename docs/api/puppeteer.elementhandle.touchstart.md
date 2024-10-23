---
sidebar_label: ElementHandle.touchStart
---

# ElementHandle.touchStart() method

This method scrolls the element into view if needed, and then starts a touch in the center of the element.

### Signature

```typescript
class ElementHandle {
  touchStart(this: ElementHandle<Element>): Promise<Touch>;
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

Promise&lt;[Touch](./puppeteer.touch_2.md)&gt;

The Touch that was started
