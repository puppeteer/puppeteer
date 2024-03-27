---
sidebar_label: Page.waitForFunction
---

# Page.waitForFunction() method

Waits for the provided function, `pageFunction`, to return a truthy value when evaluated in the page's context.

#### Signature:

```typescript
class Page {
  waitForFunction<
    Params extends unknown[],
    Func extends EvaluateFunc<Params> = EvaluateFunc<Params>,
  >(
    pageFunction: Func | string,
    options?: FrameWaitForFunctionOptions,
    ...args: Params
  ): Promise<HandleFor<Awaited<ReturnType<Func>>>>;
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

pageFunction

</td><td>

Func \| string

</td><td>

Function to be evaluated in browser context until it returns a truthy value.

</td></tr>
<tr><td>

options

</td><td>

[FrameWaitForFunctionOptions](./puppeteer.framewaitforfunctionoptions.md)

</td><td>

_(Optional)_ Options for configuring waiting behavior.

</td></tr>
<tr><td>

args

</td><td>

Params

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HandleFor](./puppeteer.handlefor.md)&lt;Awaited&lt;ReturnType&lt;Func&gt;&gt;&gt;&gt;

## Example 1

[Page.waitForFunction()](./puppeteer.page.waitforfunction.md) can be used to observe a viewport size change:

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

Arguments can be passed from Node.js to `pageFunction`:

```ts
const selector = '.foo';
await page.waitForFunction(
  selector => !!document.querySelector(selector),
  {},
  selector
);
```

## Example 3

The provided `pageFunction` can be asynchronous:

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
