---
sidebar_label: Page.emulateMediaType
---

# Page.emulateMediaType() method

### Signature

```typescript
class Page {
  abstract emulateMediaType(type?: string): Promise<void>;
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

type

</td><td>

string

</td><td>

_(Optional)_ Changes the CSS media type of the page. The only allowed values are `screen`, `print` and `null`. Passing `null` disables CSS media emulation.

</td></tr>
</tbody></table>

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
