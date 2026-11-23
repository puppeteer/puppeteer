---
sidebar_label: BrowserContext.waitForTarget
---

# BrowserContext.waitForTarget() method

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

### Signature

```typescript
class BrowserContext {
  waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: WaitForTargetOptions,
  ): Promise<Target>;
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

predicate

</td><td>

(x: [Target](./puppeteer.target.md)) =&gt; boolean \| Promise&lt;boolean&gt;

</td><td>

</td></tr>
<tr><td>

options

</td><td>

[WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Target](./puppeteer.target.md)&gt;

## Remarks

With CDP, a tab has a `"tab"` target and a `"page"` target with the same URL, and a prerendered page has a `"page"` target with the `"prerender"` [subtype](./puppeteer.target.subtype.md). Check the type and the subtype in the predicate, as the example shows.

## Example

Finding a target for a page opened via `window.open`:

```ts
await page.evaluate(() => window.open('https://www.example.com/'));
const newWindowTarget = await browserContext.waitForTarget(target => {
  return (
    target.type() === 'page' &&
    !target.subtype() &&
    target.url() === 'https://www.example.com/'
  );
});
```
