---
sidebar_label: Frame.$$
---

# Frame.$$() method

This runs `document.querySelectorAll` in the frame and returns the result.

**Signature:**

```typescript
class Frame {
  $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>>;
}
```

## Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| selector  | Selector | a selector to search for |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;

An array of element handles pointing to the found frame elements.
