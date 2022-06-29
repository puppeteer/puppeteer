---
sidebar_label: ElementHandle.tap
---

# ElementHandle.tap() method

This method scrolls element into view if needed, and then uses [Touchscreen.tap()](./puppeteer.touchscreen.tap.md) to tap in the center of the element. If the element is detached from DOM, the method throws an error.

**Signature:**

```typescript
class ElementHandle {
  tap(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;
