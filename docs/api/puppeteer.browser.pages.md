---
sidebar_label: Browser.pages
---

# Browser.pages() method

An array of all open pages inside the Browser.

#### Signature:

```typescript
class Browser {
  pages(): Promise<Page[]>;
}
```

**Returns:**

Promise&lt;[Page](./puppeteer.page.md)\[\]&gt;

## Remarks

In case of multiple browser contexts, returns an array with all the pages in all browser contexts. Non-visible pages, such as `"background_page"`, will not be listed here. You can find them using [Target.page()](./puppeteer.target.page.md).
