---
sidebar_label: Page.waitForFunction
---

# Page.waitForFunction() method

Waits for a function to finish evaluating in the page's context.

#### Signature:

```typescript
class Page {
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

| Parameter    | Type                                                                      | Description                                            |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| pageFunction | Func \| string                                                            | Function to be evaluated in browser context            |
| options      | [FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md) | _(Optional)_ Options for configuring waiting behavior. |
| args         | Params                                                                    |                                                        |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

## Example 1

The [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) can be used to observe viewport size change:

```ts
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const watchDog = page.waitForFunction('window.innerWidth < 100');
  await page.setViewport({width: 50, height: 50});
  await watchDog;
  await browser.close();
})();
```

## Example 2

To pass arguments from node.js to the predicate of [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) function:

```ts
const selector = '.foo';
await page.waitForFunction(
  selector => !!document.querySelector(selector),
  {},
  selector
);
```

## Example 3

The predicate of [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) can be asynchronous too:

```ts
const username = 'github-username';
await page.waitForFunction(
  async username => {
    const githubResponse = await fetch(
      `https://api.github.com/users/${username}`
    );
    const githubUser = await githubResponse.json();
    // show the avatar
    const img = document.createElement('img');
    img.src = githubUser.avatar_url;
    // wait 3 seconds
    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    img.remove();
  },
  {},
  username
);
```
