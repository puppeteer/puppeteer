---
sidebar_label: ElementHandle.boxModel
---

# ElementHandle.boxModel() method

This method returns boxes of the element, or `null` if the element is not visible.

#### Signature:

```typescript
class ElementHandle {
  boxModel(): Promise<BoxModel | null>;
}
```

**Returns:**

Promise&lt;[BoxModel](./puppeteer.boxmodel.md) \| null&gt;

## Remarks

Boxes are represented as an array of points; Each Point is an object `{x, y}`. Box points are sorted clock-wise.
