---
sidebar_label: ElementHandle.$
---

# ElementHandle.$() method

Runs `element.querySelector` within the page.

**Signature:**

```typescript
class ElementHandle {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type     | Description                 |
| --------- | -------- | --------------------------- |
| selector  | Selector | The selector to query with. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

`null` if no element matches the selector.

## Exceptions

`Error` if the selector has no associated query handler.
