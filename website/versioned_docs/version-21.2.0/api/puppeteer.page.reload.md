---
sidebar_label: Page.reload
---

# Page.reload() method

#### Signature:

```typescript
class Page {
  reload(options?: WaitForOptions): Promise<HTTPResponse | null>;
}
```

## Parameters

| Parameter | Type                                            | Description                                                                   |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| options   | [WaitForOptions](./puppeteer.waitforoptions.md) | _(Optional)_ Navigation parameters which might have the following properties: |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

Promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.

## Remarks

The argument `options` might have the following properties:

- `timeout` : Maximum navigation time in milliseconds, defaults to 30 seconds, pass 0 to disable timeout. The default value can be changed by using the [Page.setDefaultNavigationTimeout()](./puppeteer.page.setdefaultnavigationtimeout.md) or [Page.setDefaultTimeout()](./puppeteer.page.setdefaulttimeout.md) methods.

- `waitUntil`: When to consider navigation succeeded, defaults to `load`. Given an array of event strings, navigation is considered to be successful after all events have been fired. Events can be either:<br/> - `load` : consider navigation to be finished when the load event is fired.<br/> - `domcontentloaded` : consider navigation to be finished when the DOMContentLoaded event is fired.<br/> - `networkidle0` : consider navigation to be finished when there are no more than 0 network connections for at least `500` ms.<br/> - `networkidle2` : consider navigation to be finished when there are no more than 2 network connections for at least `500` ms.
