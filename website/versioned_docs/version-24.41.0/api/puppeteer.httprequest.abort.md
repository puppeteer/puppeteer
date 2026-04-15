---
sidebar_label: HTTPRequest.abort
---

# HTTPRequest.abort() method

Aborts a request.

### Signature

```typescript
class HTTPRequest {
  abort(errorCode?: ErrorCode, priority?: number): Promise<void>;
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

errorCode

</td><td>

[ErrorCode](./puppeteer.errorcode.md)

</td><td>

_(Optional)_ optional error code to provide.

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

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md). If it is not enabled, this method will throw an exception immediately.
