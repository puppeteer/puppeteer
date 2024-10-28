---
sidebar_label: Page.waitForFrame
---

# Page.waitForFrame() method

Waits for a frame matching the given conditions to appear.

### Signature

```typescript
class Page {
  waitForFrame(
    urlOrPredicate: string | ((frame: Frame) => Awaitable<boolean>),
    options?: WaitTimeoutOptions,
  ): Promise<Frame>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

urlOrPredicate

</td><td>

string \| ((frame: [Frame](./puppeteer.frame.md)) =&gt; [Awaitable](./puppeteer.awaitable.md)&lt;boolean&gt;)

</td><td>

</td></tr>
<tr><td>

options

</td><td>

[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[Frame](./puppeteer.frame.md)&gt;

## Example

```ts
const frame = await page.waitForFrame(async frame => {
  return frame.name() === 'Test';
});
```
