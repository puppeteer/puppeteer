---
sidebar_label: Page.$$
---

# Page.$$() method

The method runs `document.querySelectorAll` within the page. If no elements match the selector, the return value resolves to `[]`.

#### Signature:

```typescript
class Page &#123;$$<Selector extends string>(selector: Selector): Promise<Array<ElementHandle<NodeFor<Selector>>>>;&#125;
```

## Parameters

| Parameter | Type     | Description                               |
| --------- | -------- | ----------------------------------------- |
| selector  | Selector | A <code>selector</code> to query page for |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;

## Remarks

Shortcut for [Page.mainFrame().$$(selector)](./puppeteer.frame.__.md).
