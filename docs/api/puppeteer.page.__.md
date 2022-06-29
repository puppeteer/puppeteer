---
sidebar_label: Page.$$
---

# Page.$$() method

The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolves to `[]`.

**Signature:**

```typescript
class Page {
  $$<Selector extends keyof HTMLElementTagNameMap>(
    selector: Selector
  ): Promise<ElementHandle<HTMLElementTagNameMap[Selector]>[]>;
}
```

## Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| selector  | Selector | A <code>selector</code> to query page for |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;HTMLElementTagNameMap\[Selector\]&gt;\[\]&gt;

## Remarks

Shortcut for .
