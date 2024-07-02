---
sidebar_label: Page.waitForNavigation
---

# Page.waitForNavigation() method

Waits for the page to navigate to a new URL or to reload. It is useful when you run code that will indirectly cause the page to navigate.

#### Signature:

```typescript
class Page {
  waitForNavigation(options?: WaitForOptions): Promise<HTTPResponse | null>;
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

options

</td><td>

[WaitForOptions](./puppeteer.waitforoptions.md)

</td><td>

_(Optional)_ Navigation parameters which might have the following properties:

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

A `Promise` which resolves to the main resource response.

- In case of multiple redirects, the navigation will resolve with the response of the last redirect. - In case of navigation to a different anchor or navigation due to History API usage, the navigation will resolve with `null`.

## Remarks

Usage of the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) to change the URL is considered a navigation.

## Example

```ts
const [response] = await Promise.all([
  page.waitForNavigation(), // The promise resolves after navigation has finished
  page.click('a.my-link'), // Clicking the link will indirectly cause a navigation
]);
```
