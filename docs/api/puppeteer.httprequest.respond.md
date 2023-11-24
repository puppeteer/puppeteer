---
sidebar_label: HTTPRequest.respond
---

# HTTPRequest.respond() method

Fulfills a request with the given response.

#### Signature:

```typescript
class HTTPRequest &#123;abstract respond(response: Partial<ResponseForRequest>, priority?: number): Promise<void>;&#125;
```

## Parameters

| Parameter | Type                                                                   | Description                                                                                                                     |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| response  | Partial&lt;[ResponseForRequest](./puppeteer.responseforrequest.md)&gt; | the response to fulfill the request with.                                                                                       |
| priority  | number                                                                 | _(Optional)_ If provided, intercept is resolved using cooperative handling rules. Otherwise, intercept is resolved immediately. |

**Returns:**

Promise&lt;void&gt;

## Remarks

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md).

Exception is immediately thrown if the request interception is not enabled.

## Example

An example of fulfilling all requests with 404 responses:

```ts
await page.setRequestInterception(true);
page.on('request', request => &#123;
  request.respond(&#123;
    status: 404,
    contentType: 'text/plain',
    body: 'Not Found!',
  &#125;);
&#125;);
```

NOTE: Mocking responses for dataURL requests is not supported. Calling `request.respond` for a dataURL request is a noop.
