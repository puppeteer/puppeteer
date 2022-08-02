---
sidebar_label: Page.addScriptTag
---

# Page.addScriptTag() method

Adds a `<script>` tag into the page with the desired URL or content.

**Signature:**

```typescript
class Page {
  addScriptTag(options: {
    url?: string;
    path?: string;
    content?: string;
    type?: string;
    id?: string;
  }): Promise<ElementHandle<HTMLScriptElement>>;
}
```

## Parameters

| Parameter | Type                                                                           | Description |
| --------- | ------------------------------------------------------------------------------ | ----------- |
| options   | { url?: string; path?: string; content?: string; type?: string; id?: string; } |             |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLScriptElement&gt;&gt;

Promise which resolves to the added tag when the script's onload fires or when the script content was injected into frame.

## Remarks

Shortcut for [page.mainFrame().addScriptTag(options)](./puppeteer.frame.addscripttag.md).
