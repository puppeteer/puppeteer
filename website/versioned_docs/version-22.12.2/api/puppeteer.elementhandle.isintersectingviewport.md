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

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

this

</td><td>

[ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt;

</td><td>

</td></tr>
<tr><td>

options

</td><td>

&#123; threshold?: number; &#125;

</td><td>

_(Optional)_ Threshold for the intersection between 0 (no intersection) and 1 (full intersection). Defaults to 1.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;boolean&gt;
