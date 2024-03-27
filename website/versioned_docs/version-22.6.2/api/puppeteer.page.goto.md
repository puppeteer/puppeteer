---
sidebar_label: Page.goto
---

# Page.goto() method

Navigates the page to the given `url`.

#### Signature:

```typescript
class Page {
  goto(url: string, options?: GoToOptions): Promise<HTTPResponse | null>;
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

url

</td><td>

string

</td><td>

URL to navigate page to. The URL should include scheme, e.g. `https://`

</td></tr>
<tr><td>

options

</td><td>

[GoToOptions](./puppeteer.gotooptions.md)

</td><td>

_(Optional)_ Options to configure waiting behavior.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

A promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

## Exceptions

If:

- there's an SSL error (e.g. in case of self-signed certificates). - target URL is invalid. - the timeout is exceeded during navigation. - the remote server does not respond or is unreachable. - the main resource failed to load.

This method will not throw an error when any valid HTTP status code is returned by the remote server, including 404 "Not Found" and 500 "Internal Server Error". The status code for such responses can be retrieved by calling [HTTPResponse.status()](./puppeteer.httpresponse.status.md).

## Remarks

Navigation to `about:blank` or navigation to the same URL with a different hash will succeed and return `null`.

:::warning

Headless mode doesn't support navigation to a PDF document. See the [upstream issue](https://bugs.chromium.org/p/chromium/issues/detail?id=761295).

:::

Shortcut for [page.mainFrame().goto(url, options)](./puppeteer.frame.goto.md).
