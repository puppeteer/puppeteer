---
sidebar_label: Frame.waitForNavigation
---

# Frame.waitForNavigation() method

Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

#### Signature:

```typescript
class Frame {
  waitForNavigation(options?: {
    timeout?: number;
    waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
  }): Promise<HTTPResponse | null>;
}
```

## Parameters

| Parameter | Type                                                                                                                                                                          | Description                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| options   | { timeout?: number; waitUntil?: [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\]; } | _(Optional)_ options to configure when the navigation is consided finished. |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

a promise that resolves when the frame navigates to a new URL.

## Example

```ts
const [response] = await Promise.all([
  // The navigation promise resolves after navigation has finished
  frame.waitForNavigation(),
  // Clicking the link will indirectly cause a navigation
  frame.click('a.my-link'),
]);
```
