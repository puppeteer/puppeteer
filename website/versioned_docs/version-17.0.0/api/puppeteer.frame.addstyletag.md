---
sidebar_label: Frame.addStyleTag
---

# Frame.addStyleTag() method

Adds a `<link rel="stylesheet">` tag into the page with the desired url or a `<style type="text/css">` tag with the content.

**Signature:**

```typescript
class Frame {
  addStyleTag(
    options: FrameAddStyleTagOptions
  ): Promise<ElementHandle<HTMLStyleElement | HTMLLinkElement>>;
}
```

## Parameters

| Parameter | Type                                                              | Description                 |
| --------- | ----------------------------------------------------------------- | --------------------------- |
| options   | [FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md) | Options for the style link. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLStyleElement \| HTMLLinkElement&gt;&gt;

a promise that resolves to the added tag when the stylesheets's `onload` event fires or when the CSS content was injected into the frame.
