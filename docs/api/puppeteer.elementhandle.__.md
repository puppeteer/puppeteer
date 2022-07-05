---
sidebar_label: ElementHandle.$$
---

# ElementHandle.$$() method

Runs `element.querySelectorAll` within the page.

**Signature:**

```typescript
class ElementHandle {
  $$<Selector extends string>(
    selector: Selector
  ): Promise<Array<ElementHandle<NodeFor<Selector>>>>;
}
```

## Parameters

| Parameter | Type     | Description                 |
| --------- | -------- | --------------------------- |
| selector  | Selector | The selector to query with. |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;

`[]` if no element matches the selector.

## Exceptions

`Error` if the selector has no associated query handler.
