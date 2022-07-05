---
sidebar_label: Page.addStyleTag
---

# Page.addStyleTag() method

Adds a `<link rel="stylesheet">` tag into the page with the desired URL or a `<style type="text/css">` tag with the content.

**Signature:**

```typescript
class Page {
  addStyleTag(options: {
    url?: string;
    path?: string;
    content?: string;
  }): Promise<ElementHandle<Node>>;
}
```

## Parameters

| Parameter | Type                                               | Description |
| --------- | -------------------------------------------------- | ----------- |
| options   | { url?: string; path?: string; content?: string; } |             |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;

Promise which resolves to the added tag when the stylesheet's onload fires or when the CSS content was injected into frame.
