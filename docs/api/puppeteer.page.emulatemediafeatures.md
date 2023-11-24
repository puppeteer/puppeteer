---
sidebar_label: Page.emulateMediaFeatures
---

# Page.emulateMediaFeatures() method

#### Signature:

```typescript
class Page &#123;abstract emulateMediaFeatures(features?: MediaFeature[]): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                            | Description                                                                                                                                                                                            |
| --------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| features  | [MediaFeature](./puppeteer.mediafeature.md)\[\] | _(Optional)_ <code>&lt;?Array&lt;Object&gt;&gt;</code> Given an array of media feature objects, emulates CSS media features on the page. Each media feature object must have the following properties: |

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.emulateMediaFeatures([
  &#123;name: 'prefers-color-scheme', value: 'dark'&#125;,
]);
await page.evaluate(
  () => matchMedia('(prefers-color-scheme: dark)').matches
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-color-scheme: light)').matches
);
// → false

await page.emulateMediaFeatures([
  &#123;name: 'prefers-reduced-motion', value: 'reduce'&#125;,
]);
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: reduce)').matches
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: no-preference)').matches
);
// → false

await page.emulateMediaFeatures([
  &#123;name: 'prefers-color-scheme', value: 'dark'&#125;,
  &#123;name: 'prefers-reduced-motion', value: 'reduce'&#125;,
]);
await page.evaluate(
  () => matchMedia('(prefers-color-scheme: dark)').matches
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-color-scheme: light)').matches
);
// → false
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: reduce)').matches
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: no-preference)').matches
);
// → false

await page.emulateMediaFeatures([&#123;name: 'color-gamut', value: 'p3'&#125;]);
await page.evaluate(() => matchMedia('(color-gamut: srgb)').matches);
// → true
await page.evaluate(() => matchMedia('(color-gamut: p3)').matches);
// → true
await page.evaluate(() => matchMedia('(color-gamut: rec2020)').matches);
// → false
```
