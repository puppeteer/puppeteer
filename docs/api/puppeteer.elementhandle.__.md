---
sidebar_label: ElementHandle.$$
---

# ElementHandle.$$() method

Queries the current element for all elements matching the given selector.

#### Signature:

```typescript
class ElementHandle &#123;$$<Selector extends string>(selector: Selector): Promise<Array<ElementHandle<NodeFor<Selector>>>>;&#125;
```

## Parameters

| Parameter | Type     | Description                |
| --------- | -------- | -------------------------- |
| selector  | Selector | The selector to query for. |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt;&gt;&gt;

An array of [element handles](./puppeteer.elementhandle.md) that point to elements matching the given selector.
