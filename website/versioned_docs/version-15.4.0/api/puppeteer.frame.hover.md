---
sidebar_label: Frame.hover
---

# Frame.hover() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.mouse.md) to hover over the center of the element.

**Signature:**

```typescript
class Frame {
  hover(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                                                       |
| --------- | ------ | ------------------------------------------------------------------------------------------------- |
| selector  | string | the selector for the element to hover. If there are multiple elements, the first will be hovered. |

**Returns:**

Promise&lt;void&gt;

## Remarks

If there's no element matching `selector`, the method throws an
