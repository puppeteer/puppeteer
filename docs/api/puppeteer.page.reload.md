---
sidebar_label: Page.reload
---

# Page.reload() method

Reloads the page.

#### Signature:

```typescript
class Page &#123;abstract reload(options?: WaitForOptions): Promise<HTTPResponse | null>;&#125;
```

## Parameters

| Parameter | Type                                            | Description                                         |
| --------- | ----------------------------------------------- | --------------------------------------------------- |
| options   | [WaitForOptions](./puppeteer.waitforoptions.md) | _(Optional)_ Options to configure waiting behavior. |

**Returns:**

Promise&lt;[HTTPResponse](./puppeteer.httpresponse.md) \| null&gt;

A promise which resolves to the main resource response. In case of multiple redirects, the navigation will resolve with the response of the last redirect.
