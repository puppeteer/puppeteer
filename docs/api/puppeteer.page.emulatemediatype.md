---
sidebar_label: Page.emulateMediaType
---

# Page.emulateMediaType() method

#### Signature:

```typescript
class Page {
  emulateMediaType(type?: string): Promise<void>;
}
```

## Parameters

| Parameter | Type   | Description                                                                                                                                                                                             |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type      | string | _(Optional)_ Changes the CSS media type of the page. The only allowed values are <code>screen</code>, <code>print</code> and <code>null</code>. Passing <code>null</code> disables CSS media emulation. |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.evaluate(() => matchMedia('screen').matches);
// → true
await page.evaluate(() => matchMedia('print').matches);
// → false

await page.emulateMediaType('print');
await page.evaluate(() => matchMedia('screen').matches);
// → false
await page.evaluate(() => matchMedia('print').matches);
// → true

await page.emulateMediaType(null);
await page.evaluate(() => matchMedia('screen').matches);
// → true
await page.evaluate(() => matchMedia('print').matches);
// → false
```
