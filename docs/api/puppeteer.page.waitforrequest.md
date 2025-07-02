---
sidebar_label: Page.waitForRequest
---

# Page.waitForRequest() method

### Signature

```typescript
class Page {
  waitForRequest(
    urlOrPredicate: string | AwaitablePredicate<HTTPRequest>,
    options?: WaitTimeoutOptions,
  ): Promise<HTTPRequest>;
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

string \| [AwaitablePredicate](./puppeteer.awaitablepredicate.md)&lt;[HTTPRequest](./puppeteer.httprequest.md)&gt;

</td><td>

A URL or predicate to wait for

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

Promise&lt;[HTTPRequest](./puppeteer.httprequest.md)&gt;

Promise which resolves to the matched request

## Remarks

Optional Waiting Parameters have:

- `timeout`: Maximum wait time in milliseconds, defaults to `30` seconds, pass `0` to disable the timeout. The default value can be changed by using the [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) method.

## Example

```ts
const firstRequest = await page.waitForRequest('https://example.com/resource');
const finalRequest = await page.waitForRequest(
  request => request.url() === 'https://example.com',
);
return finalRequest.response()?.ok();
```
