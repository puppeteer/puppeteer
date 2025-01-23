---
sidebar_label: ElementHandle.backendNodeId
---

# ElementHandle.backendNodeId() method

When connected using Chrome DevTools Protocol, it returns a DOM.BackendNodeId for the element.

### Signature

```typescript
class ElementHandle {
  abstract backendNodeId(): Promise<number>;
}
```

**Returns:**

Promise&lt;number&gt;
