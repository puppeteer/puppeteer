---
sidebar_label: Page.setRequestInterception
---

# Page.setRequestInterception() method

Activating request interception enables [HTTPRequest.abort()](./puppeteer.httprequest.abort.md), [HTTPRequest.continue()](./puppeteer.httprequest.continue.md) and [HTTPRequest.respond()](./puppeteer.httprequest.respond.md) methods. This provides the capability to modify network requests that are made by a page.

Once request interception is enabled, every request will stall unless it's continued, responded or aborted; or completed using the browser cache.

See the [Request interception guide](https://pptr.dev/next/guides/request-interception) for more details.

#### Signature:

```typescript
class Page &#123;abstract setRequestInterception(value: boolean): Promise<void>;&#125;
```

## Parameters

| Parameter | Type    | Description                             |
| --------- | ------- | --------------------------------------- |
| value     | boolean | Whether to enable request interception. |

**Returns:**

Promise&lt;void&gt;

## Example

An example of a naïve request interceptor that aborts all image requests:

```ts
import puppeteer from 'puppeteer';
(async () => &#123;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', interceptedRequest => &#123;
    if (
      interceptedRequest.url().endsWith('.png') ||
      interceptedRequest.url().endsWith('.jpg')
    )
      interceptedRequest.abort();
    else interceptedRequest.continue();
  &#125;);
  await page.goto('https://example.com');
  await browser.close();
&#125;)();
```
