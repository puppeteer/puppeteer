---
sidebar_label: Page.cookies
---

# Page.cookies() method

> Warning: This API is now obsolete.
>
> Page-level cookie API is deprecated. Use [Browser.cookies()](./puppeteer.browser.cookies.md) or [BrowserContext.cookies()](./puppeteer.browsercontext.cookies.md) instead.

If no URLs are specified, this method returns cookies for the current page URL. If URLs are specified, only cookies for those URLs are returned.

### Signature

```typescript
class Page {
  abstract cookies(...urls: string[]): Promise<Cookie[]>;
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

urls

</td><td>

string\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Cookie](./puppeteer.cookie.md)\[\]&gt;
