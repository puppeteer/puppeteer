---
sidebar_label: SerializedAXNode.elementHandle
---

# SerializedAXNode.elementHandle() method

Get an ElementHandle for this AXNode if available.

If the underlying DOM element has been disposed, the method might return an error. If the frame has navigated to a new document since the snapshot, the method returns `null`.

### Signature

```typescript
interface SerializedAXNode {
  elementHandle(): Promise<ElementHandle | null>;
}
```

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md) \| null&gt;
