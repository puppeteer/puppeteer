---
sidebar_label: Frame.$x
---

# Frame.$x() method

> Warning: This API is now obsolete.
>
> Use [Frame.$$()](./puppeteer.frame.__.md) with the `xpath` prefix.
>
> Example: `await frame.$$('xpath/' + xpathExpression)`
>
> This method evaluates the given XPath expression and returns the results. If `xpath` starts with `//` instead of `.//`, the dot will be appended automatically.

#### Signature:

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
