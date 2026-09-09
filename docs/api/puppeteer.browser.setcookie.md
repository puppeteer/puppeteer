---
sidebar_label: Browser.setCookie
---

# Browser.setCookie() method

Sets cookies in the default [BrowserContext](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  setCookie(...cookies: CookieData[]): Promise<void>;
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

[CookieData](./puppeteer.cookiedata.md)\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Shortcut for [browser.defaultBrowserContext().setCookie()](./puppeteer.browsercontext.setcookie.md).
