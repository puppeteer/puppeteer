---
sidebar_label: Frame.$$
---

# Frame.$$() method

This runs `document.querySelectorAll` in the frame and returns the result.

**Signature:**

```typescript
class Frame {
  $$<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]>[]>;
}
```

## Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| selector  | Selector | a selector to search for |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt;\[\]&gt;

An array of element handles pointing to the found frame elements.
