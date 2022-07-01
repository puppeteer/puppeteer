---
sidebar_label: Page.$x
---

# Page.$x() method

The method evaluates the XPath expression relative to the page document as its context node. If there are no such elements, the method resolves to an empty array.

**Signature:**

```typescript
class Page {
  $x(expression: string): Promise<ElementHandle[]>;
}
```

## Parameters

| Parameter  | Type   | Description            |
| ---------- | ------ | ---------------------- |
| expression | string | Expression to evaluate |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)\[\]&gt;

## Remarks

Shortcut for [Page.mainFrame().$x(expression)](./puppeteer.frame._x.md).
