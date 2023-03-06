---
sidebar_label: Page.goto
---

# Page.goto() method

#### Signature:

```typescript
class Page {
  goto(
    url: string,
    options?: WaitForOptions & {
      referer?: string;
      referrerPolicy?: string;
    }
  ): Promise<HTTPResponse | null>;
}
```

## Parameters

| Parameter | Type                                                                                                 | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| url       | string                                                                                               | URL to navigate page to. The URL should include scheme, e.g. <code>https://</code> |
| options   | [WaitForOptions](./puppeteer.waitforoptions.md) &amp; { referer?: string; referrerPolicy?: string; } | _(Optional)_ Navigation Parameter                                                  |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

## Remarks

The argument `options` might have the following properties:

- `timeout` : Maximum navigation time in milliseconds, defaults to 30 seconds, pass 0 to disable timeout. The default value can be changed by using the [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) or [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) methods.

- `waitUntil`:When to consider navigation succeeded, defaults to `load`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:<br/> - `load` : consider navigation to be finished when the load event is fired.<br/> - `domcontentloaded` : consider navigation to be finished when the DOMContentLoaded event is fired.<br/> - `networkidle0` : consider navigation to be finished when there are no more than 0 network connections for at least `500` ms.<br/> - `networkidle2` : consider navigation to be finished when there are no more than 2 network connections for at least `500` ms.

- `referer` : Referer header value. If provided it will take preference over the referer header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md).<br/> - `referrerPolicy` : ReferrerPolicy. If provided it will take preference over the referer-policy header value set by [page.setExtraHTTPHeaders()](./puppeteer.page.setextrahttpheaders.md).

`page.goto` will throw an error if:

- there's an SSL error (e.g. in case of self-signed certificates). - target URL is invalid. - the timeout is exceeded during navigation. - the remote server does not respond or is unreachable. - the main resource failed to load.

`page.goto` will not throw an error when any valid HTTP status code is returned by the remote server, including 404 "Not Found" and 500 "Internal Server Error". The status code for such responses can be retrieved by calling response.status().

NOTE: `page.goto` either throws an error or returns a main resource response. The only exceptions are navigation to about:blank or navigation to the same URL with a different hash, which would succeed and return null.

NOTE: Headless mode doesn't support navigation to a PDF document. See the [upstream issue](https://bugs.chromium.org/p/chromium/issues/detail?id=761295).

Shortcut for [page.mainFrame().goto(url, options)](./puppeteer.frame.goto.md).
