---
sidebar_label: Frame.addStyleTag
---

# Frame.addStyleTag() method

<h2 id="overload-0">addStyleTag(options: Omit&lt;FrameAddStyleTagOptions, 'url'&gt;): Promise&lt;ElementHandle&lt;HTMLStyleElement&gt;&gt;;</h2>

### Signature:

```typescript
class Frame {
  addStyleTag(
    options: Omit<FrameAddStyleTagOptions, 'url'>
  ): Promise<ElementHandle<HTMLStyleElement>>;
}
```

Adds a `HTMLStyleElement` into the frame with the desired URL

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

Omit&lt;[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md), 'url'&gt;

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLStyleElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the loaded `<style>` element.

<h2 id="overload-1">addStyleTag(options: FrameAddStyleTagOptions): Promise&lt;ElementHandle&lt;HTMLLinkElement&gt;&gt;;</h2>

### Signature:

```typescript
class Frame {
  addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLLinkElement>>;
}
```

Adds a `HTMLLinkElement` into the frame with the desired URL

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
