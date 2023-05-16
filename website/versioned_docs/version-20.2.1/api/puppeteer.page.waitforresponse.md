---
sidebar_label: Page.waitForResponse
---

# Page.waitForResponse() method

#### Signature:

```typescript
class Page {
  waitForResponse(
    urlOrPredicate:
      | string
      | ((res: HTTPResponse) => boolean | Promise<boolean>),
    options?: {
      timeout?: number;
    }
  ): Promise<HTTPResponse>;
}
```

## Parameters

| Parameter      | Type                                                                                                   | Description                              |
| -------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| urlOrPredicate | string \| ((res: [HTTPResponse](./puppeteer.httpresponse.md)) =&gt; boolean \| Promise&lt;boolean&gt;) | A URL or predicate to wait for.          |
| options        | { timeout?: number; }                                                                                  | _(Optional)_ Optional waiting parameters |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md)&gt;

Promise which resolves to the matched response.

## Remarks

Optional Parameter have:

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
