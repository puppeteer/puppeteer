---
sidebar_label: Frame.goto
---

# Frame.goto() method

Navigates the frame to the given `url`.

#### Signature:

```typescript
class Frame \{abstract goto(url: string, options?: \{
        referer?: string;
        referrerPolicy?: string;
        timeout?: number;
        waitUntil?: PuppeteerLifeCycleEvent | PuppeteerLifeCycleEvent[];
    \}): Promise<HTTPResponse | null>;\}
```

## Parameters

| Parameter | Type                                                                                                                                                                                                                       | Description                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| url       | string                                                                                                                                                                                                                     | URL to navigate the frame to. The URL should include scheme, e.g. <code>https://</code> |
| options   | \{ referer?: string; referrerPolicy?: string; timeout?: number; waitUntil?: [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md) \| [PuppeteerLifeCycleEvent](./puppeteer.puppeteerlifecycleevent.md)\[\]; \} | _(Optional)_ Options to configure waiting behavior.                                     |

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
