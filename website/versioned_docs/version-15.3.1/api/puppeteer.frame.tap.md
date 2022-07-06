---
sidebar_label: Frame.tap
---

# Frame.tap() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.touchscreen](./puppeteer.page.touchscreen.md) to tap in the center of the element.

**Signature:**

```typescript
class Frame {
  tap(selector: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description          |
| --------- | ------ | -------------------- |
| selector  | string | the selector to tap. |

**Returns:**

Promise&lt;void&gt;

a promise that resolves when the element has been tapped.

## Remarks

If there's no element matching `selector`, the method throws an error.
