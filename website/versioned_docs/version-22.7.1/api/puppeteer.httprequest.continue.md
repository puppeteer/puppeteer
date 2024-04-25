---
sidebar_label: HTTPRequest.continue
---

# HTTPRequest.continue() method

Continues request with optional request overrides.

#### Signature:

```typescript
class HTTPRequest {
  continue(
    overrides?: ContinueRequestOverrides,
    priority?: number
  ): Promise<void>;
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

overrides

</td><td>

[ContinueRequestOverrides](./puppeteer.continuerequestoverrides.md)

</td><td>

_(Optional)_ optional overrides to apply to the request.

</td></tr>
<tr><td>

priority

</td><td>

number

</td><td>

_(Optional)_ If provided, intercept is resolved using cooperative handling rules. Otherwise, intercept is resolved immediately.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Remarks

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md).

Exception is immediately thrown if the request interception is not enabled.

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
