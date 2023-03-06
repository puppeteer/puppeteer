---
sidebar_label: Page.waitForFrame
---

# Page.waitForFrame() method

#### Signature:

```typescript
class Page {
  waitForFrame(
    urlOrPredicate: string | ((frame: Frame) => boolean | Promise<boolean>),
    options?: {
      timeout?: number;
    }
  ): Promise<Frame>;
}
```

## Parameters

| Parameter      | Type                                                                                       | Description                              |
| -------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| urlOrPredicate | string \| ((frame: [Frame](./puppeteer.frame.md)) =&gt; boolean \| Promise&lt;boolean&gt;) | A URL or predicate to wait for.          |
| options        | { timeout?: number; }                                                                      | _(Optional)_ Optional waiting parameters |

**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;

Promise which resolves to the matched frame.

## Remarks

Optional Parameter have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

## Example

```ts
const frame = await page.waitForFrame(async frame => {
  return frame.name() === 'Test';
});
```
