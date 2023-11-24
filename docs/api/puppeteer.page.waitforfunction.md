---
sidebar_label: Page.waitForFunction
---

# Page.waitForFunction() method

Waits for a function to finish evaluating in the page's context.

#### Signature:

```typescript
class Page &#123;waitForFunction<Params extends unknown[], Func extends EvaluateFunc<Params> = EvaluateFunc<Params>>(pageFunction: Func | string, options?: FrameWaitForFunctionOptions, ...args: Params): Promise<HandleFor<Awaited<ReturnType<Func>>>>;&#125;
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
(async () => &#123;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const watchDog = page.waitForFunction('window.innerWidth < 100');
  await page.setViewport(&#123;width: 50, height: 50&#125;);
  await watchDog;
  await browser.close();
&#125;)();
```

## Example 2

To pass arguments from node.js to the predicate of [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) function:

```ts
const selector = '.foo';
await page.waitForFunction(
  selector => !!document.querySelector(selector),
  &#123;&#125;,
  selector
);
```

## Example 3

The predicate of [Page.waitForFunction()](./puppeteer.page.waitforfunction.md) can be asynchronous too:

```ts
const username = 'github-username';
await page.waitForFunction(
  async username => &#123;
    const githubResponse = await fetch(
      `https://api.github.com/users/$&#123;username&#125;`
    );
    const githubUser = await githubResponse.json();
    // show the avatar
    const img = document.createElement('img');
    img.src = githubUser.avatar_url;
    // wait 3 seconds
    await new Promise((resolve, reject) => setTimeout(resolve, 3000));
    img.remove();
  &#125;,
  &#123;&#125;,
  username
);
```
