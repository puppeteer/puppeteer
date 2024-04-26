---
sidebar_label: Page.setRequestInterception
---

# Page.setRequestInterception() method

Activating request interception enables [HTTPRequest.abort()](./puppeteer.httprequest.abort.md), [HTTPRequest.continue()](./puppeteer.httprequest.continue.md) and [HTTPRequest.respond()](./puppeteer.httprequest.respond.md) methods. This provides the capability to modify network requests that are made by a page.

Once request interception is enabled, every request will stall unless it's continued, responded or aborted; or completed using the browser cache.

See the [Request interception guide](https://pptr.dev/guides/network-interception) for more details.

#### Signature:

```typescript
class Page {
  abstract setRequestInterception(value: boolean): Promise<void>;
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

value

</td><td>

boolean

</td><td>

Whether to enable request interception.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Example

An example of a naïve request interceptor that aborts all image requests:

```ts
import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => {
    if (
      interceptedRequest.url().endsWith('.png') ||
      interceptedRequest.url().endsWith('.jpg')
    )
      interceptedRequest.abort();
    else interceptedRequest.continue();
  });
  await page.goto('https://example.com');
  await browser.close();
})();
```
