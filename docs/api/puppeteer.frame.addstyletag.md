---
sidebar_label: Frame.addStyleTag
---

# Frame.addStyleTag() method

Adds a `HTMLStyleElement` into the frame with the desired URL

#### Signature:

```typescript
class Frame &#123;addStyleTag(options: Omit<FrameAddStyleTagOptions, 'url'>): Promise<ElementHandle<HTMLStyleElement>>;&#125;
```

## Parameters

| Parameter | Type                                                                                 | Description |
| --------- | ------------------------------------------------------------------------------------ | ----------- |
| options   | Omit&lt;[FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md), 'url'&gt; |             |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLStyleElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the loaded `<style>` element.
