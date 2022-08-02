---
sidebar_label: Page.waitForRequest
---

# Page.waitForRequest() method

**Signature:**

```typescript
class Page {
  waitForRequest(
    urlOrPredicate: string | ((req: HTTPRequest) => boolean | Promise<boolean>),
    options?: {
      timeout?: number;
    }
  ): Promise<HTTPRequest>;
}
```

## Parameters

| Parameter      | Type                                                                                                 | Description                                   |
| -------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| urlOrPredicate | string \| ((req: [HTTPRequest](./puppeteer.httprequest.md)) =&gt; boolean \| Promise&lt;boolean&gt;) | A URL or predicate to wait for                |
| options        | { timeout?: number; }                                                                                | <i>(Optional)</i> Optional waiting parameters |

**Returns:**

Promise&lt;[HTTPRequest](./puppeteer.httprequest.md)&gt;

Promise which resolves to the matched response

## Remarks

Optional Waiting Parameters have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

## Example

```ts
const firstResponse = await page.waitForResponse(
  'https://example.com/resource'
);
const finalResponse = await page.waitForResponse(
  response =>
    response.url() === 'https://example.com' && response.status() === 200
);
const finalResponse = await page.waitForResponse(async response => {
  return (await response.text()).includes('<html>');
});
return finalResponse.ok();
```
