---
sidebar_label: HTTPRequest.respond
---

# HTTPRequest.respond() method

Fulfills a request with the given response.

#### Signature:

```typescript
class HTTPRequest {
  respond(
    response: Partial<ResponseForRequest>,
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

response

</td><td>

Partial&lt;[ResponseForRequest](./puppeteer.responseforrequest.md)&gt;

</td><td>

the response to fulfill the request with.

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

An example of fulfilling all requests with 404 responses:

```ts
await page.setRequestInterception(true);
page.on('request', request => {
  request.respond({
    status: 404,
    contentType: 'text/plain',
    body: 'Not Found!',
  });
});
```

NOTE: Mocking responses for dataURL requests is not supported. Calling `request.respond` for a dataURL request is a noop.
