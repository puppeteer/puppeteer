---
sidebar_label: Frame.waitForXPath
---

# Frame.waitForXPath() method

**Signature:**

```typescript
class Frame {
  waitForXPath(
    xpath: string,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<Node> | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                                                                 |
| --------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| xpath     | string                                                          | the XPath expression to wait for.                                                                           |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | <i>(Optional)</i> options to configure the visiblity of the element and how long to wait before timing out. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; \| null&gt;

## Remarks

Wait for the `xpath` to appear in page. If at the moment of calling the method the `xpath` already exists, the method will return immediately. If the xpath doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

For a code example, see the example for [Frame.waitForSelector()](./puppeteer.frame.waitforselector.md). That function behaves identically other than taking a CSS selector rather than an XPath.
