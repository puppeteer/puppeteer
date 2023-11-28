---
sidebar_label: Page.$
---

# Page.$() method

Runs `document.querySelector` within the page. If no element matches the selector, the return value resolves to `null`.

#### Signature:

```typescript
class Page {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type     | Description                                                                                                                             |
| --------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| selector  | Selector | A <code>selector</code> to query page for [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) to query page for. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;
