---
sidebar_label: Page.emulateMediaFeatures
---

# Page.emulateMediaFeatures() method

### Signature

```typescript
class Page {
  abstract emulateMediaFeatures(features?: MediaFeature[]): Promise<void>;
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

features

</td><td>

[MediaFeature](./puppeteer.mediafeature.md)\[\]

</td><td>

_(Optional)_ `<?Array<Object>>` Given an array of media feature objects, emulates CSS media features on the page. Each media feature object must have the following properties:

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.emulateMediaFeatures([
  {name: 'prefers-color-scheme', value: 'dark'},
]);
await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches);
// → true
await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches);
// → false

await page.emulateMediaFeatures([
  {name: 'prefers-reduced-motion', value: 'reduce'},
]);
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: reduce)').matches,
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
);
// → false

await page.emulateMediaFeatures([
  {name: 'prefers-color-scheme', value: 'dark'},
  {name: 'prefers-reduced-motion', value: 'reduce'},
]);
await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches);
// → true
await page.evaluate(() => matchMedia('(prefers-color-scheme: light)').matches);
// → false
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: reduce)').matches,
);
// → true
await page.evaluate(
  () => matchMedia('(prefers-reduced-motion: no-preference)').matches,
);
// → false

await page.emulateMediaFeatures([{name: 'color-gamut', value: 'p3'}]);
await page.evaluate(() => matchMedia('(color-gamut: srgb)').matches);
// → true
await page.evaluate(() => matchMedia('(color-gamut: p3)').matches);
// → true
await page.evaluate(() => matchMedia('(color-gamut: rec2020)').matches);
// → false
```
