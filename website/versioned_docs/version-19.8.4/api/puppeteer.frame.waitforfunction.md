---
sidebar_label: Frame.waitForFunction
---

# Frame.waitForFunction() method

#### Signature:

```typescript
class Frame {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    options?: FrameWaitForFunctionOptions,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
}
```

## Parameters

| Parameter    | Type                                                                      | Description                                                       |
| ------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| pageFunction | Func \| string                                                            | the function to evaluate in the frame context.                    |
| options      | [FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md) | _(Optional)_ options to configure the polling method and timeout. |
| args         | Params                                                                    | arguments to pass to the <code>pageFunction</code>.               |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

the promise which resolve when the `pageFunction` returns a truthy value.

## Example

The `waitForFunction` can be used to observe viewport size change:

```ts
import puppeteer from 'puppeteer';

(async () => {
.  const browser = await puppeteer.launch();
.  const page = await browser.newPage();
.  const watchDog = page.mainFrame().waitForFunction('window.innerWidth < 100');
.  page.setViewport({width: 50, height: 50});
.  await watchDog;
.  await browser.close();
})();
```

To pass arguments from Node.js to the predicate of `page.waitForFunction` function:

```ts
const selector = '.foo';
await frame.waitForFunction(
  selector => !!document.querySelector(selector),
  {}, // empty options object
  selector
);
```
