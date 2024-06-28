---
sidebar_label: Page.viewport
---

# Page.viewport() method

### Signature:

```typescript
class Page {
  abstract viewport(): Viewport | null;
}
```

Returns the current page viewport settings without checking the actual page viewport.

This is either the viewport set with the previous [Page.setViewport()](./puppeteer.page.setviewport.md) call or the default viewport set via [BrowserConnectOptions.defaultViewport](./puppeteer.browserconnectoptions.md#defaultviewport).

**Returns:**

[Viewport](./puppeteer.viewport.md) \| null
