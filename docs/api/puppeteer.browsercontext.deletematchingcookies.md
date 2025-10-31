---
sidebar_label: BrowserContext.deleteMatchingCookies
---

# BrowserContext.deleteMatchingCookies() method

Deletes cookies matching the provided filters in this browser context.

### Signature

```typescript
class BrowserContext {
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

[DeleteCookiesRequest](./puppeteer.deletecookiesrequest.md)

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;void&gt;
