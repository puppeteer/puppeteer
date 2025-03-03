---
sidebar_label: Page.deleteCookie
---

# Page.deleteCookie() method

> Warning: This API is now obsolete.
>
> Page-level cookie API is deprecated. Use [Browser.deleteCookie()](./puppeteer.browser.deletecookie.md) or [BrowserContext.deleteCookie()](./puppeteer.browsercontext.deletecookie.md) instead.

### Signature

```typescript
class Page {
  abstract deleteCookie(...cookies: DeleteCookiesRequest[]): Promise<void>;
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

cookies

</td><td>

[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)\[\]

</td><td>

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
