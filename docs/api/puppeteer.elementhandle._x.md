---
sidebar_label: ElementHandle.$x
---

# ElementHandle.$x() method

> Warning: This API is now obsolete.
>
> Use [ElementHandle.$$()](./puppeteer.elementhandle.__.md) with the `xpath` prefix.
>
> Example: `await elementHandle.$$('xpath/' + xpathExpression)`
>
> The method evaluates the XPath expression relative to the elementHandle. If `xpath` starts with `//` instead of `.//`, the dot will be appended automatically.
>
> If there are no such elements, the method will resolve to an empty array.

#### Signature:

```typescript
class ElementHandle {
  $x(expression: string): Promise<Array<ElementHandle<Node>>>;
}
```

## Parameters

| Parameter  | Type   | Description                                                                                  |
| ---------- | ------ | -------------------------------------------------------------------------------------------- |
| expression | string | Expression to [evaluate](https://developer.mozilla.org/en-US/docs/Web/API/Document/evaluate) |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;&gt;
