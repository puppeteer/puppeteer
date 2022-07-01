---
sidebar_label: Frame.$x
---

# Frame.$x() method

This method evaluates the given XPath expression and returns the results.

**Signature:**

```typescript
class Frame {
  $x(expression: string): Promise<ElementHandle[]>;
}
```

## Parameters

| Parameter  | Type   | Description                       |
| ---------- | ------ | --------------------------------- |
| expression | string | the XPath expression to evaluate. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)\[\]&gt;
