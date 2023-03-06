---
sidebar_label: ElementHandle.waitForSelector
---

# ElementHandle.waitForSelector() method

Wait for an element matching the given selector to appear in the current element.

Unlike [Frame.waitForSelector()](./puppeteer.frame.waitforselector.md), this method does not work across navigations or if the element is detached from DOM.

#### Signature:

```typescript
class ElementHandle {
  waitForSelector<Selector extends string>(
    selector: Selector,
    options?: WaitForSelectorOptions
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type                                                            | Description                                            |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| selector  | Selector                                                        | The selector to query and wait for.                    |
| options   | [WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md) | _(Optional)_ Options for customizing waiting behavior. |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

An element matching the given selector.

## Exceptions

Throws if an element matching the given selector doesn't appear.

## Example

```ts
import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let currentURL;
  page
    .mainFrame()
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
