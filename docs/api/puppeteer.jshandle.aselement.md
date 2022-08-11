---
sidebar_label: JSHandle.asElement
---

# JSHandle.asElement() method

**Signature:**

```typescript
class JSHandle {
  asElement(): ElementHandle<Node> | null;
}
```

**Returns:**

[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; \| null

Either `null` or the handle itself if the handle is an instance of [ElementHandle](./puppeteer.elementhandle.md).
