---
sidebar_label: Frame.setContent
---

# Frame.setContent() method

Set the content of the frame.

#### Signature:

```typescript
class Frame {
  setContent(
    html: string,
    options?: {
      timeout?: number;
      waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    }
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                                                                                                                          | Description                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| html      | string                                                                                                                                                                        | HTML markup to assign to the page.                                                                                         |
| options   | { timeout?: number; waitUntil?: [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\]; } | _(Optional)_ Options to configure how long before timing out and at what point to consider the content setting successful. |

**Returns:**

Promise&lt;void&gt;
