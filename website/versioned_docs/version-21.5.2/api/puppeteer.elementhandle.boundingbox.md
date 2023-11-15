---
sidebar_label: ElementHandle.boundingBox
---

# ElementHandle.boundingBox() method

This method returns the bounding box of the element (relative to the main frame), or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

#### Signature:

```typescript
class ElementHandle {
  boundingBox(): Promise<BoundingBox | null>;
}
```

**Returns:**

Promise&lt;[BoundingBox](./puppeteer.boundingbox.md) \| null&gt;
