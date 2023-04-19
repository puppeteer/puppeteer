---
sidebar_label: ElementHandle.isIntersectingViewport
---

# ElementHandle.isIntersectingViewport() method

Resolves to true if the element is visible in the current viewport. If an element is an SVG, we check if the svg owner element is in the viewport instead. See https://crbug.com/963246.

#### Signature:

```typescript
class ElementHandle {
  isIntersectingViewport(
    this: ElementHandle<Element>,
    options?: {
      threshold?: number;
    }
  ): Promise<boolean>;
}
```

## Parameters

| Parameter | Type                                                         | Description                                                                                                       |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |                                                                                                                   |
| options   | { threshold?: number; }                                      | _(Optional)_ Threshold for the intersection between 0 (no intersection) and 1 (full intersection). Defaults to 1. |

**Returns:**

Promise&lt;boolean&gt;
