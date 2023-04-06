---
sidebar_label: ElementHandle.contentFrame
---

# ElementHandle.contentFrame() method

Resolves to the content frame for element handles referencing iframe nodes, or null otherwise

#### Signature:

```typescript
class ElementHandle {
  contentFrame(): Promise<Frame | null>;
}
```

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md) \| null&gt;
