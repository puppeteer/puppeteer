---
sidebar_label: Frame.click
---

# Frame.click() method

Clicks the first element found that matches `selector`.

### Signature

```typescript
class Frame {
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

The selector to query for.

</td></tr>
<tr><td>

options

</td><td>

Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt;

</td><td>

_(Optional)_

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

If `click()` triggers a navigation event and there's a separate `page.waitForNavigation()` promise to be resolved, you may end up with a race condition that yields unexpected results. The correct pattern for click and wait for navigation is the following:

```ts
const [response] = await Promise.all([
  page.waitForNavigation(waitOptions),
  frame.click(selector, clickOptions),
]);
```
