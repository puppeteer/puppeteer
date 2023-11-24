---
sidebar_label: ElementHandle.click
---

# ElementHandle.click() method

This method scrolls element into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to click in the center of the element. If the element is detached from DOM, the method throws an error.

#### Signature:

```typescript
class ElementHandle &#123;click(this: ElementHandle<Element>, options?: Readonly<ClickOptions>): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                         | Description  |
| --------- | ------------------------------------------------------------ | ------------ |
| this      | [ElementHandle](./puppeteer.elementhandle.md)&lt;Element&gt; |              |
| options   | Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt;  | _(Optional)_ |

**Returns:**

Promise&lt;void&gt;
