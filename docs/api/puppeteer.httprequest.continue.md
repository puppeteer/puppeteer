---
sidebar_label: HTTPRequest.continue
---

# HTTPRequest.continue() method

Continues request with optional request overrides.

#### Signature:

```typescript
class HTTPRequest {
  abstract continue(
    overrides?: ContinueRequestOverrides,
    priority?: number
  ): Promise<void>;
}
```

## Parameters

| Parameter | Type                                                                | Description                                                                                                                     |
| --------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| overrides | [ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md) | _(Optional)_ optional overrides to apply to the request.                                                                        |
| priority  | number                                                              | _(Optional)_ If provided, intercept is resolved using cooperative handling rules. Otherwise, intercept is resolved immediately. |

**Returns:**

Promise&lt;void&gt;

## Remarks

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md).

Exception is immediately thrown if the request interception is not enabled.

Not supported with [WebDriver BiDi](https://pptr.dev/faq#q-what-is-the-status-of-cross-browser-support).

## Example

```ts
await page.setRequestInterception(true);
page.on('request', request => {
  // Override headers
  const headers = Object.assign({}, request.headers(), {
    foo: 'bar', // set "foo" header
    origin: undefined, // remove "origin" header
  });
  request.continue({headers});
});
```
