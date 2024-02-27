---
sidebar_label: Page.waitForFrame
---

# Page.waitForFrame() method

Waits for a frame matching the given conditions to appear.

#### Signature:

```typescript
class Page {
  waitForFrame(
    urlOrPredicate: string | ((frame: Frame) => Awaitable<boolean>),
    options?: WaitTimeoutOptions
  ): Promise<Frame>;
}
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
const frame = await page.waitForFrame(async frame => {
  return (await frame.name()) === 'Test';
});
```
