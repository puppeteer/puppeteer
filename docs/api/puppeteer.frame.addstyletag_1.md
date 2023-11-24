---
sidebar_label: Frame.addStyleTag_1
---

# Frame.addStyleTag() method

Adds a `HTMLLinkElement` into the frame with the desired URL

#### Signature:

```typescript
class Frame &#123;addStyleTag(options: FrameAddStyleTagOptions): Promise<ElementHandle<HTMLLinkElement>>;&#125;
```

## Parameters

| Parameter | Type                                                              | Description |
| --------- | ----------------------------------------------------------------- | ----------- |
| options   | [FrameAddStyleTagOptions](./puppeteer.frameaddstyletagoptions.md) |             |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLLinkElement&gt;&gt;

An [element handle](./puppeteer.elementhandle.md) to the loaded `<link>` element.
