---
sidebar_label: Page.waitForFunction
---

# Page.waitForFunction() method

Waits for a function to finish evaluating in the page's context.

**Signature:**

```typescript
class Page {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>
  >(
    pageFunction: Func | string,
    options?: {
      timeout?: number;
      polling?: string | number;
    },
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
}
```

## Parameters

| Parameter    | Type                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pageFunction | Func \| string                                    | Function to be evaluated in browser context                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| options      | { timeout?: number; polling?: string \| number; } | <i>(Optional)</i> Optional waiting parameters - <code>polling</code> - An interval at which the <code>pageFunction</code> is executed, defaults to <code>raf</code>. If <code>polling</code> is a number, then it is treated as an interval in milliseconds at which the function would be executed. If polling is a string, then it can be one of the following values: - <code>raf</code> - to constantly execute <code>pageFunction</code> in <code>requestAnimationFrame</code> callback. This is the tightest polling mode which is suitable to observe styling changes. - <code>mutation</code>- to execute pageFunction on every DOM mutation. - <code>timeout</code> - maximum time to wait for in milliseconds. Defaults to <code>30000</code> (30 seconds). Pass <code>0</code> to disable timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method. |
| args         | Params                                            | Arguments to pass to <code>pageFunction</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

A `Promise` which resolves to a JSHandle/ElementHandle of the the `pageFunction`'s return value.

## Example 1

The [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) can be used to observe viewport size change:

```ts
const puppeteer = require('puppeteer');
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
