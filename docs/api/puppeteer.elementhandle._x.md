---
sidebar_label: ElementHandle.$x
---

# ElementHandle.$x() method

The method evaluates the XPath expression relative to the elementHandle. If there are no such elements, the method will resolve to an empty array.

**Signature:**

```typescript
class ElementHandle {
  $x(expression: string): Promise<ElementHandle[]>;
}
```

## Parameters

| Parameter  | Type   | Description                                                                                  |
| ---------- | ------ | -------------------------------------------------------------------------------------------- |
| expression | string | Expression to [evaluate](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)\[\]&gt;
