---
sidebar_label: Page.setCookie
---

# Page.setCookie() method

> Warning: This API is now obsolete.
>
> Page-level cookie API is deprecated. Use [Browser.setCookie()](./puppeteer.browser.setcookie.md) or [BrowserContext.setCookie()](./puppeteer.browsercontext.setcookie.md) instead.

### Signature

```typescript
class Page {
  abstract setCookie(...cookies: CookieParam[]): Promise<void>;
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

[CookieParam](./puppeteer.cookieparam.md)\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Example

```ts
await page.setCookie(cookieObject1, cookieObject2);
```
