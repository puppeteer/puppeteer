---
sidebar_label: Page.waitForXPath_2
---

# Page.waitForXPath() method

#### Signature:

```typescript
class Page {
  waitForXPath(
    xpath: string,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<Node> | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description       |
| --------- | --------------------------------------------------------------- | ----------------- |
| xpath     | string                                                          |                   |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | <i>(Optional)</i> |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; \| null&gt;
