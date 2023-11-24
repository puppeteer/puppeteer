---
sidebar_label: Frame.setContent
---

# Frame.setContent() method

Set the content of the frame.

#### Signature:

```typescript
class Frame &#123;abstract setContent(html: string, options?: &#123;
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    &#125;): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                                                                                                                                    | Description                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| html      | string                                                                                                                                                                                  | HTML markup to assign to the page.                                                                                         |
| options   | &#123; timeout?: number; waitUntil?: [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\]; &#125; | _(Optional)_ Options to configure how long before timing out and at what point to consider the content setting successful. |

**Returns:**

Promise&lt;void&gt;
