---
sidebar_label: Frame.waitForNavigation
---

# Frame.waitForNavigation() method

Waits for the frame to navigate. It is useful for when you run code which will indirectly cause the frame to navigate.

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

#### Signature:

```typescript
class Frame \{abstract waitForNavigation(options?: WaitForOptions): Promise<HTTPResponse | null>;\}
```

## Parameters

| Parameter | Type                                            | Description                                         |
| --------- | ----------------------------------------------- | --------------------------------------------------- |
| options   | [WaitForOptions](./puppeteer.waitforoptions.md) | _(Optional)_ Options to configure waiting behavior. |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

A promise which resolves to the main resource response.

## Example

```ts
const [response] = await Promise.all([
  // The navigation promise resolves after navigation has finished
  frame.waitForNavigation(),
  // Clicking the link will indirectly cause a navigation
  frame.click('a.my-link'),
]);
```
