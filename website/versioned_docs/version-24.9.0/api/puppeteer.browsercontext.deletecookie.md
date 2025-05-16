---
sidebar_label: BrowserContext.deleteCookie
---

# BrowserContext.deleteCookie() method

Removes cookie in the browser context

### Signature

```typescript
class BrowserContext {
  deleteCookie(...cookies: Cookie[]): Promise<void>;
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

[cookie](./puppeteer.cookie.md) to remove

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;
