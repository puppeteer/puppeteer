---
sidebar_label: Frame.setContent
---

# Frame.setContent() method

Set the content of the frame.

#### Signature:

```typescript
class Frame {
  abstract setContent(html: string, options?: WaitForOptions): Promise<void>;
}
```

## Parameters

| Parameter | Type                                            | Description                                                                                                                |
| --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| html      | string                                          | HTML markup to assign to the page.                                                                                         |
| options   | [WaitForOptions](./puppeteer.waitforoptions.md) | _(Optional)_ Options to configure how long before timing out and at what point to consider the content setting successful. |

**Returns:**

Promise&lt;void&gt;
