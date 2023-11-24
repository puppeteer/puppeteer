---
sidebar_label: Browser.waitForTarget
---

# Browser.waitForTarget() method

Waits until a [target](./puppeteer.target.md) matching the given `predicate` appears and returns it.

This will look all open [browser contexts](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class Browser &#123;waitForTarget(predicate: (x: Target) => boolean | Promise<boolean>, options?: WaitForTargetOptions): Promise<Target>;&#125;
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
const newWindowTarget = await browser.waitForTarget(
  target => target.url() === 'https://www.example.com/'
);
```
