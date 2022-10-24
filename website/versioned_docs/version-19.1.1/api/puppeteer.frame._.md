---
sidebar_label: Frame.$
---

# Frame.$() method

Queries the frame for an element matching the given selector.

#### Signature:

```typescript
class Frame {
  $<Selector extends string>(
    selector: Selector
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| selector  | Selector | The selector to query for. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

A [element handle](./puppeteer.elementhandle.md) to the first element matching the given selector. Otherwise, `null`.
