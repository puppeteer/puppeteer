---
sidebar_label: Browser.deleteMatchingCookies
---

# Browser.deleteMatchingCookies() method

Deletes cookies matching the provided filters from the default [BrowserContext](./puppeteer.browsercontext.md).

### Signature

```typescript
class Browser {
  deleteMatchingCookies(...filters: DeleteCookiesRequest[]): Promise<void>;
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

filters

</td><td>

[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)\[\]

</td><td>

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;

## Remarks

Shortcut for [browser.defaultBrowserContext().deleteMatchingCookies()](./puppeteer.browsercontext.deletematchingcookies.md).
