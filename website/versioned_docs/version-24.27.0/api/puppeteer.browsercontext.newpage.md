---
sidebar_label: BrowserContext.newPage
---

# BrowserContext.newPage() method

Creates a new [page](./puppeteer.page.md) in this [browser context](./puppeteer.browsercontext.md).

### Signature

```typescript
class BrowserContext {
  abstract newPage(options?: CreatePageOptions): Promise<Page>;
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

options

</td><td>

[CreatePageOptions](./puppeteer.createpageoptions.md)

</td><td>

_(Optional)_

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)&gt;
