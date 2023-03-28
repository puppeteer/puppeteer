---
sidebar_label: ElementHandle.waitForXPath
---

# ElementHandle.waitForXPath() method

> Warning: This API is now obsolete.
>
> Use [ElementHandle.waitForSelector()](./puppeteer.elementhandle.waitforselector.md) with the `xpath` prefix.
>
> Example: `await elementHandle.waitForSelector('xpath/' + xpathExpression)`
>
> The method evaluates the XPath expression relative to the elementHandle.
>
> Wait for the `xpath` within the element. If at the moment of calling the method the `xpath` already exists, the method will return immediately. If the `xpath` doesn't appear after the `timeout` milliseconds of waiting, the function will throw.
>
> If `xpath` starts with `//` instead of `.//`, the dot will be appended automatically.

#### Signature:

```typescript
class ElementHandle {
  waitForXPath(
    xpath: string,
    options?: {
      visible?: boolean;
      hidden?: boolean;
      timeout?: number;
    }
  ): Promise<ElementHandle<Node> | null>;
}
```

## Parameters

| Parameter | Type                                                       | Description                                                                             |
| --------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| xpath     | string                                                     | A [xpath](https://developer.mozilla.org/en-US/docs/Web/XPath) of an element to wait for |
| options   | { visible?: boolean; hidden?: boolean; timeout?: number; } | _(Optional)_ Optional waiting parameters                                                |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;Node&gt; \| null&gt;

Promise which resolves when element specified by xpath string is added to DOM. Resolves to `null` if waiting for `hidden: true` and xpath is not found in DOM, otherwise resolves to `ElementHandle`.

## Remarks

The optional Argument `options` have properties:

- `visible`: A boolean to wait for element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `hidden`: A boolean wait for element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `timeout`: A number which is maximum time to wait for in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

## Example

This method works across navigation.

```ts
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let currentURL;
  page
    .waitForXPath('//img')
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
