---
sidebar_label: Frame.$
---

# Frame.$() method

This method queries the frame for the given selector.

**Signature:**

```typescript
class Frame {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type     | Description              |
| --------- | -------- | ------------------------ |
| selector  | Selector | a selector to query for. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

A promise which resolves to an `ElementHandle` pointing at the element, or `null` if it was not found.
