---
sidebar_label: ElementHandle.boundingBox
---

# ElementHandle.boundingBox() method

### Signature:

```typescript
class ElementHandle {
  boundingBox(): Promise<BoundingBox | null>;
}
```

This method returns the bounding box of the element (relative to the main frame), or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

**Returns:**

Promise&lt;[BoundingBox](./puppeteer.boundingbox.md) \| null&gt;
