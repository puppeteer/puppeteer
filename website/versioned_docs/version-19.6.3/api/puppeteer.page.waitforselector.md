---
sidebar_label: Page.waitForSelector
---

# Page.waitForSelector() method

Wait for the `selector` to appear in page. If at the moment of calling the method the `selector` already exists, the method will return immediately. If the `selector` doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method works across navigations:

```ts
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let currentURL;
  page
    .waitForSelector('img')
    .then(() => console.log('First URL with image: ' + currentURL));
  for (currentURL of [
    'https://example.com',
    'https://google.com',
    'https://bbc.com',
  ]) {
    await page.goto(currentURL);
  }
  await browser.close();
})();
```

#### Signature:

```typescript
class Page {
  waitForSelector<Selector extends string>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                                                                            |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| selector  | Selector                                                        | A [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) of an element to wait for |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | <i>(Optional)</i> Optional waiting parameters                                                          |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

Promise which resolves when element specified by selector string is added to DOM. Resolves to `null` if waiting for hidden: `true` and selector is not found in DOM.

## Remarks

The optional Parameter in Arguments `options` are:

- `visible`: A boolean wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `hidden`: Wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `timeout`: maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.
