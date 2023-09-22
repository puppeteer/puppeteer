---
sidebar_label: Page.hover
---

# Page.hover() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to hover over the center of the element. If there's no element matching `selector`, the method throws an error.

#### Signature:

```typescript
class Page {
  hover(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                                                                                                                                                     |
| --------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string | A [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to search for element to hover. If there are multiple elements satisfying the selector, the first will be hovered. |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the element matching `selector` is successfully hovered. Promise gets rejected if there's no element matching `selector`.

## Remarks

Shortcut for [page.mainFrame().hover(selector)](./puppeteer.page.hover.md).
