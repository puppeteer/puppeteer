---
sidebar_label: SerializedAXNode.elementHandle
---

# SerializedAXNode.elementHandle() method

### Signature:

```typescript
interface SerializedAXNode {
  elementHandle(): Promise<ElementHandle | null>;
}
```

Get an ElementHandle for this AXNode if available.

If the underlying DOM element has been disposed, the method might return an error.

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md) \| null&gt;
