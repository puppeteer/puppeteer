---
sidebar_label: Page.waitForResponse
---

# Page.waitForResponse() method

### Signature

```typescript
class Page {
  waitForResponse(
    urlOrPredicate: string | AwaitablePredicate<HTTPResponse>,
    options?: WaitTimeoutOptions,
  ): Promise<HTTPResponse>;
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

urlOrPredicate

</td><td>

string \| [AwaitablePredicate](./puppeteer.awaitablepredicate.md)&lt;[HTTPResponse](./puppeteer.httpresponse.md)&gt;

</td><td>

A URL or predicate to wait for.

</td></tr>
<tr><td>

options

</td><td>

[WaitTimeoutOptions](./puppeteer.waittimeoutoptions.md)

</td><td>

_(Optional)_ Optional waiting parameters

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md)&gt;

Promise which resolves to the matched response.

## Remarks

Optional Parameter have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

## Example

```ts
const firstResponse = await page.waitForResponse(
  'https://example.com/resource',
);
const finalResponse = await page.waitForResponse(
  response =>
    response.url() === 'https://example.com' && response.status() === 200,
);
const finalResponse = await page.waitForResponse(async response => {
  return (await response.text()).includes('<html>');
});
return finalResponse.ok();
```
