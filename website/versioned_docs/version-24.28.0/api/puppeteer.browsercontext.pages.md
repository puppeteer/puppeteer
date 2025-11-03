---
sidebar_label: BrowserContext.pages
---

# BrowserContext.pages() method

Gets a list of all open [pages](./puppeteer.page.md) inside this [browser context](./puppeteer.browsercontext.md).

### Signature

```typescript
class BrowserContext {
  abstract pages(includeAll?: boolean): Promise<Page[]>;
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

includeAll

</td><td>

boolean

</td><td>

_(Optional)_ experimental, setting to true includes all kinds of pages.

</td></tr>
</tbody></table>

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

## Remarks

Non-visible [pages](./puppeteer.page.md), such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).
