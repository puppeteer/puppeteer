---
sidebar_label: Frame.frameElement
---

# Frame.frameElement() method

#### Signature:

```typescript
class Frame {
  frameElement(): Promise<HandleFor<HTMLIFrameElement> | null>;
}
```

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;HTMLIFrameElement&gt; \| null&gt;

The frame element associated with this frame (if any).
