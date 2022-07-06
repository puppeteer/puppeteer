---
sidebar_label: Frame.addStyleTag
---

# Frame.addStyleTag() method

Adds a `<link rel="stylesheet">` tag into the page with the desired url or a `<style type="text/css">` tag with the content.

**Signature:**

```typescript
class Frame {
  addStyleTag(options: FrameAddStyleTagOptions): Promise<ElementHandle<Node>>;
}
```

## Parameters

| Parameter | Type                                                              | Description                           |
| --------- | ----------------------------------------------------------------- | ------------------------------------- |
| options   | [FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md) | configure the CSS to add to the page. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;

a promise that resolves to the added tag when the stylesheets's `onload` event fires or when the CSS content was injected into the frame.
