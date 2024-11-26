---
sidebar_label: BrowserContext.setCookie
---

# BrowserContext.setCookie() method

Sets a cookie in the browser context.

### Signature

```typescript
class BrowserContext {
  abstract setCookie(...cookies: Cookie[]): Promise<void>;
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

[Cookie](./puppeteer.cookie.md)\[\]

</td><td>

[cookie](./puppeteer.cookie.md) to set

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
