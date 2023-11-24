---
sidebar_label: Page.waitForFrame
---

# Page.waitForFrame() method

Waits for a frame matching the given conditions to appear.

#### Signature:

```typescript
class Page &#123;waitForFrame(urlOrPredicate: string | ((frame: Frame) => Awaitable<boolean>), options?: WaitTimeoutOptions): Promise<Frame>;&#125;
```

## Parameters

| Parameter      | Type                                                                                                          | Description  |
| -------------- | ------------------------------------------------------------------------------------------------------------- | ------------ |
| urlOrPredicate | string \| ((frame: [Frame](./puppeteer.frame.md)) =&gt; [Awaitable](./puppeteer.awaitable.md)&lt;boolean&gt;) |              |
| options        | [WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)                                                       | _(Optional)_ |

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;

## Example

```ts
const frame = await page.waitForFrame(async frame => &#123;
  return frame.name() === 'Test';
&#125;);
```
