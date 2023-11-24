---
sidebar_label: ElementHandle.isIntersectingViewport
---

# ElementHandle.isIntersectingViewport() method

Resolves to true if the element is visible in the current viewport. If an element is an SVG, we check if the svg owner element is in the viewport instead. See https://crbug.com/963246.

#### Signature:

```typescript
class ElementHandle &#123;isIntersectingViewport(this: ElementHandle<Element>, options?: &#123;
        threshold?: number;
    &#125;): Promise<boolean>;&#125;
```

## Parameters

| Parameter | Type                                                         | Description                                                                                                       |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |                                                                                                                   |
| options   | &#123; threshold?: number; &#125;                            | _(Optional)_ Threshold for the intersection between 0 (no intersection) and 1 (full intersection). Defaults to 1. |

**Returns:**

Promise&lt;boolean&gt;
