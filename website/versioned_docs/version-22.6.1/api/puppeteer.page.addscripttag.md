---
sidebar_label: Page.addScriptTag
---

# Page.addScriptTag() method

Adds a `<script>` tag into the page with the desired URL or content.

#### Signature:

```typescript
class Page {
  addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>>;
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

[FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md)

</td><td>

Options for the script.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLScriptElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the injected `<script>` element.

## Remarks

Shortcut for [page.mainFrame().addScriptTag(options)](./puppeteer.frame.addscripttag.md).
