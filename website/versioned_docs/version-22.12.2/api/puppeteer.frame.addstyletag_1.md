---
sidebar_label: Frame.addStyleTag_1
---

# Frame.addStyleTag() method

Adds a `HTMLLinkElement` into the frame with the desired URL

#### Signature:

```typescript
class Frame {
  addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLLinkElement>>;
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

options

</td><td>

[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md)

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLLinkElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the loaded `<link>` element.
