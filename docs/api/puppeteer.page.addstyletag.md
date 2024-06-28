---
sidebar_label: Page.addStyleTag
---

# Page.addStyleTag() method

<h2 id="overload-0">addStyleTag(options: Omit&lt;FrameAddStyleTagOptions, 'url'&gt;): Promise&lt;ElementHandle&lt;HTMLStyleElement&gt;&gt;;</h2>

### Signature:

```typescript
class Page {
  addStyleTag(
    options: Omit<FrameAddStyleTagOptions, 'url'>
  ): Promise<ElementHandle<HTMLStyleElement>>;
}
```

Adds a `<link rel="stylesheet">` tag into the page with the desired URL or a `<style type="text/css">` tag with the content.

Shortcut for [page.mainFrame().addStyleTag(options)](./puppeteer.frame.addstyletag.md).

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

An [element handle](./puppeteer.elementhandle.md) to the injected `<link>` or `<style>` element.

<h2 id="overload-1">addStyleTag(options: FrameAddStyleTagOptions): Promise&lt;ElementHandle&lt;HTMLLinkElement&gt;&gt;;</h2>

### Signature:

```typescript
class Page {
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
