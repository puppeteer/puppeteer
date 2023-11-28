---
sidebar_label: Frame.addScriptTag
---

# Frame.addScriptTag() method

Adds a `<script>` tag into the page with the desired url or content.

#### Signature:

```typescript
class Frame {
  addScriptTag(
    options: FrameAddScriptTagOptions
  ): Promise<ElementHandle<HTMLScriptElement>>;
}
```

## Parameters

| Parameter | Type                                                                | Description             |
| --------- | ------------------------------------------------------------------- | ----------------------- |
| options   | [FrameAddScriptTagOptions](./puppeteer.frameaddscripttagoptions.md) | Options for the script. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLScriptElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the injected `<script>` element.
