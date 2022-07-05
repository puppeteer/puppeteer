---
sidebar_label: Frame.$x
---

# Frame.$x() method

This method evaluates the given XPath expression and returns the results.

**Signature:**

```typescript
class Frame {
  $x(expression: string): Promise<Array<ElementHandle<Node>>>;
}
```

## Parameters

| Parameter  | Type   | Description                       |
| ---------- | ------ | --------------------------------- |
| expression | string | the XPath expression to evaluate. |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;&gt;
