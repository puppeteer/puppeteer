---
sidebar_label: Frame.click
---

# Frame.click() method

Clicks the first element found that matches `selector`.

#### Signature:

```typescript
class Frame {
  click(selector: string, options?: Readonly<ClickOptions>): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                        | Description                |
| --------- | ----------------------------------------------------------- | -------------------------- |
| selector  | string                                                      | The selector to query for. |
| options   | Readonly&lt;[ClickOptions](./puppeteer.clickoptions.md)&gt; | _(Optional)_               |

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
