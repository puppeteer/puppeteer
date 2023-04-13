---
sidebar_label: BrowserContext.waitForTarget
---

# BrowserContext.waitForTarget() method

This searches for a target in this specific browser context.

#### Signature:

```typescript
class BrowserContext {
  waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: {
      timeout?: number;
    }
  ): Promise<Target>;
}
```

## Parameters

| Parameter | Type                                                                         | Description                                                                                                                                                               |
| --------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| predicate | (x: [Target](./puppeteer.target.md)) =&gt; boolean \| Promise&lt;boolean&gt; | A function to be run for every target                                                                                                                                     |
| options   | { timeout?: number; }                                                        | _(Optional)_ An object of options. Accepts a timeout, which is the maximum wait time in milliseconds. Pass <code>0</code> to disable the timeout. Defaults to 30 seconds. |

**Returns:**

Promise&lt;[Target](./puppeteer.target.md)&gt;

Promise which resolves to the first target found that matches the `predicate` function.

## Example

An example of finding a target for a page opened via `window.open`:

```ts
await page.evaluate(() => window.open('https://www.example.com/'));
const newWindowTarget = await browserContext.waitForTarget(
  target => target.url() === 'https://www.example.com/'
);
```
