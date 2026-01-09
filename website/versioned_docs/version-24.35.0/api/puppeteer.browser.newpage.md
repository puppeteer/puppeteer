---
sidebar_label: Browser.newPage
---

# Browser.newPage() method

Creates a new [page](./puppeteer.page.md) in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md).

### Signature

```typescript
class Browser {
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
