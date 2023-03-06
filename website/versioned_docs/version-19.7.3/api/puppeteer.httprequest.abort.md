---
sidebar_label: HTTPRequest.abort
---

# HTTPRequest.abort() method

Aborts a request.

#### Signature:

```typescript
class HTTPRequest {
  abort(errorCode?: ErrorCode, priority?: number): Promise<void>;
}
```

## Parameters

| Parameter | Type                                  | Description                                                                                                                     |
| --------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| errorCode | [ErrorCode](./puppeteer.errorcode.md) | _(Optional)_ optional error code to provide.                                                                                    |
| priority  | number                                | _(Optional)_ If provided, intercept is resolved using cooperative handling rules. Otherwise, intercept is resolved immediately. |

**Returns:**

Promise&lt;void&gt;

## Remarks

To use this, request interception should be enabled with [Page.setRequestInterception()](./puppeteer.page.setrequestinterception.md). If it is not enabled, this method will throw an exception immediately.
