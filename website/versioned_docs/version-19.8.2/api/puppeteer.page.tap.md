---
sidebar_label: Page.tap
---

# Page.tap() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.md) to tap in the center of the element. If there's no element matching `selector`, the method throws an error.

#### Signature:

```typescript
class Page {
  tap(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                                                                                                                                                  |
| --------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | string | A [Selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to search for element to tap. If there are multiple elements satisfying the selector, the first will be tapped. |

**Returns:**

Promise&lt;void&gt;

## Remarks

Shortcut for [page.mainFrame().tap(selector)](./puppeteer.frame.tap.md).
