---
sidebar_label: ElementHandle.boxModel
---

# ElementHandle.boxModel() method

This method returns boxes of the element, or `null` if the element is [not part of the layout](https://drafts.csswg.org/css-display-4/#box-generation) (example: `display: none`).

#### Signature:

```typescript
class ElementHandle &#123;boxModel(): Promise<BoxModel | null>;&#125;
```

**Returns:**

Promise&lt;[BoxModel](./puppeteer.boxmodel.md) \| null&gt;

## Remarks

Boxes are represented as an array of points; Each Point is an object `&#123;x, y&#125;`. Box points are sorted clock-wise.
