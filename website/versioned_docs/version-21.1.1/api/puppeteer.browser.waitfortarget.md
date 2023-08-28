---
sidebar_label: Browser.waitForTarget
---

# Browser.waitForTarget() method

Searches for a target in all browser contexts.

#### Signature:

```typescript
class Browser {
  waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: WaitForTargetOptions
  ): Promise<Target>;
}
```

## Parameters

| Parameter | Type                                                                         | Description                            |
| --------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| predicate | (x: [Target](./puppeteer.target.md)) =&gt; boolean \| Promise&lt;boolean&gt; | A function to be run for every target. |
| options   | [WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)                  | _(Optional)_                           |

**Returns:**

Promise&lt;[Target](./puppeteer.target.md)&gt;

The first target found that matches the `predicate` function.

## Example

An example of finding a target for a page opened via `window.open`:

```ts
await page.evaluate(() => window.open('https://www.example.com/'));
const newWindowTarget = await browser.waitForTarget(
  target => target.url() === 'https://www.example.com/'
);
```
