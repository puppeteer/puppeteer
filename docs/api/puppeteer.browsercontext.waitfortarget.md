---
sidebar_label: BrowserContext.waitForTarget
---

# BrowserContext.waitForTarget() method

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class BrowserContext {
  waitForTarget(
    predicate: (x: Target) => boolean | Promise<boolean>,
    options?: WaitForTargetOptions
  ): Promise<Target>;
}
```

## Parameters

| Parameter | Type                                                                         | Description  |
| --------- | ---------------------------------------------------------------------------- | ------------ |
| predicate | (x: [Target](./puppeteer.target.md)) =&gt; boolean \| Promise&lt;boolean&gt; |              |
| options   | [WaitForTargetOptions](./puppeteer.waitfortargetoptions.md)                  | _(Optional)_ |

**Returns:**

Promise&lt;[Target](./puppeteer.target.md)&gt;

## Example

Finding a target for a page opened via `window.open`:

```ts
await page.evaluate(() => window.open('https://www.example.com/'));
const newWindowTarget = await browserContext.waitForTarget(
  target => target.url() === 'https://www.example.com/'
);
```
