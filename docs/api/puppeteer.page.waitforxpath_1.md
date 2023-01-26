---
sidebar_label: Page.waitForXPath_1
---

# Page.waitForXPath() method

#### Signature:

```typescript
class Page {
  waitForXPath(
    xpath: string,
    options?: WaitForSelectorOptions & {
      hidden: false;
    }
  ): Promise<ElementHandle<Node>>;
}
```

## Parameters

| Parameter | Type                                                                                     | Description       |
| --------- | ---------------------------------------------------------------------------------------- | ----------------- |
| xpath     | string                                                                                   |                   |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) &amp; { hidden: false; } | <i>(Optional)</i> |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt;&gt;
