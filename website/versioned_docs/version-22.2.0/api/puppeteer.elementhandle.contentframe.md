---
sidebar_label: ElementHandle.contentFrame
---

# ElementHandle.contentFrame() method

Resolves the frame associated with the element, if any. Always exists for HTMLIFrameElements.

#### Signature:

```typescript
class ElementHandle {
  abstract contentFrame(this: ElementHandle<HTMLIFrameElement>): Promise<Frame>;
}
```

## Parameters

| Parameter | Type                                                                   | Description |
| --------- | ---------------------------------------------------------------------- | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLIFrameElement&gt; |             |

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;
