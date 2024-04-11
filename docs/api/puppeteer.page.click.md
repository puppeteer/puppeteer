---
sidebar_label: Page.click
---

# Page.click() method

This method fetches an element with `selector`, scrolls it into view if needed, and then uses [Page.mouse](./puppeteer.page.md#mouse) to click in the center of the element. If there's no element matching `selector`, the method throws an error.

#### Signature:

```typescript
class Page {
  click(selector: string, options?: Readonly<ClickOptions>): Promise<void>;
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

selector

</td><td>

string

</td><td>

A `selector` to search for element to click. If there are multiple elements satisfying the `selector`, the first will be clicked

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt;

</td><td>

_(Optional)_ `Object`

</td></tr>
</tbody></table>
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
