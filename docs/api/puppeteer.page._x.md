---
sidebar_label: Page.$x
---

# Page.$x() method

The method evaluates the XPath expression relative to the page document as its context node. If there are no such elements, the method resolves to an empty array.

#### Signature:

```typescript
class Page &#123;$x(expression: string): Promise<Array<ElementHandle<Node>>>;&#125;
```

## Parameters

| Parameter  | Type   | Description            |
| ---------- | ------ | ---------------------- |
| expression | string | Expression to evaluate |

**Returns:**

Promise&lt;Array&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;&gt;

## Remarks

Shortcut for [Page.mainFrame().$x(expression)](./puppeteer.frame._x.md).
