---
sidebar_label: ElementHandle.waitForSelector
---

# ElementHandle.waitForSelector() method

Wait for the `selector` to appear within the element. If at the moment of calling the method the `selector` already exists, the method will return immediately. If the `selector` doesn't appear after the `timeout` milliseconds of waiting, the function will throw.

This method does not work across navigations or if the element is detached from DOM.

**Signature:**

```typescript
class ElementHandle {
  waitForSelector<Selector extends string>(
    selector: Selector,
    options?: Exclude<WaitForSelectorOptions, 'root'>
  ): Promise<ElementHandle<NodeFor<Selector>> | null>;
}
```

## Parameters

| Parameter | Type                                                                                   | Description                                                                                            |
| --------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| selector  | Selector                                                                               | A [selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) of an element to wait for |
| options   | Exclude&lt;[WaitForSelectorOptions](./puppeteer.waitforselectoroptions.md), 'root'&gt; | <i>(Optional)</i> Optional waiting parameters                                                          |

**Returns:**

Promise&lt;[ElementHandle](./puppeteer.elementhandle.md)&lt;[NodeFor](./puppeteer.nodefor.md)&lt;Selector&gt;&gt; \| null&gt;

Promise which resolves when element specified by selector string is added to DOM. Resolves to `null` if waiting for hidden: `true` and selector is not found in DOM.

## Remarks

The optional parameters in `options` are:

- `visible`: wait for the selected element to be present in DOM and to be visible, i.e. to not have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `hidden`: wait for the selected element to not be found in the DOM or to be hidden, i.e. have `display: none` or `visibility: hidden` CSS properties. Defaults to `false`.

- `timeout`: maximum time to wait in milliseconds. Defaults to `30000` (30 seconds). Pass `0` to disable timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.
