---
sidebar_label: Browser.waitForTarget
---

# Browser.waitForTarget() method

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
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

## Example

Finding a target for a page opened via `window.open`:

```ts
await page.evaluate(() => window.open('https://www.example.com/'));
const newWindowTarget = await browser.waitForTarget(
  target => target.url() === 'https://www.example.com/',
);
```
