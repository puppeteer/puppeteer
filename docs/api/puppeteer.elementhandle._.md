---
sidebar_label: ElementHandle.$
---

# ElementHandle.$() method

Queries the current element for an element matching the given selector.

#### Signature:

```typescript
class ElementHandle &#123;$<Selector extends string>(selector: Selector): Promise<ElementHandle<NodeFor<Selector>> | null>;&#125;
```

## Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| selector  | Selector | The selector to query for. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

A [element handle](./puppeteer.elementhandle.md) to the first element matching the given selector. Otherwise, `null`.
