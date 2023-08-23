---
sidebar_label: ElementHandle.contentFrame
---

# ElementHandle.contentFrame() method

Resolves the frame associated with the element.

#### Signature:

```typescript
class ElementHandle {
  contentFrame(this: ElementHandle<HTMLIFrameElement>): Promise<Frame>;
}
```

## Parameters

| Parameter | Type                                                                   | Description |
| --------- | ---------------------------------------------------------------------- | ----------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLIFrameElement&gt; |             |

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;
