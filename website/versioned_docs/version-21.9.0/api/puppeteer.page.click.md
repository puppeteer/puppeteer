---
sidebar_label: Page.click
---

# Page.click() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md) to click in the center of the element. If there's no element matching `selector`, the method throws an error.

#### Signature:

```typescript
class Page {
  click(selector: string, options?: Readonly<ClickOptions>): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                        | Description                                                                                                                                            |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| selector  | string                                                      | A <code>selector</code> to search for element to click. If there are multiple elements satisfying the <code>selector</code>, the first will be clicked |
| options   | Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt; | _(Optional)_ <code>Object</code>                                                                                                                       |

**Returns:**

Promise&lt;void&gt;

Promise which resolves when the element matching `selector` is successfully clicked. The Promise will be rejected if there is no element matching `selector`.

## Remarks

Bear in mind that if `click()` triggers a navigation event and there's a separate `page.waitForNavigation()` promise to be resolved, you may end up with a race condition that yields unexpected results. The correct pattern for click and wait for navigation is the following:

```ts
const [response] = await Promise.all([
  page.waitForNavigation(waitOptions),
  page.click(selector, clickOptions),
]);
```

Shortcut for [page.mainFrame().click(selector\[, options\])](./puppeteer.frame.click.md).
