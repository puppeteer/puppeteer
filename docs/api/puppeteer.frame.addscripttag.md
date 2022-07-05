---
sidebar_label: Frame.addScriptTag
---

# Frame.addScriptTag() method

Adds a `<script>` tag into the page with the desired url or content.

**Signature:**

```typescript
class Frame {
  addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>>;
}
```

## Parameters

| Parameter | Type                                                                | Description                              |
| --------- | ------------------------------------------------------------------- | ---------------------------------------- |
| options   | [FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md) | configure the script to add to the page. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLScriptElement&gt;&gt;

a promise that resolves to the added tag when the script's `onload` event fires or when the script content was injected into the frame.
