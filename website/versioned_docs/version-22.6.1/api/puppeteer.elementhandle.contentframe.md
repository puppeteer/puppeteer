---
sidebar_label: ElementHandle.contentFrame
---

# ElementHandle.contentFrame() method

Resolves the frame associated with the element, if any. Always exists for HTMLIFrameElements.

#### Signature:

```typescript
class ElementHandle {
  abstract contentFrame(this: ElementHandle<HTMLIFrameElement>): Promise<Frame>;
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

[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLIFrameElement&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;
