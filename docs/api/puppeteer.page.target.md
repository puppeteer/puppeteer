---
sidebar_label: Page.target
---

# Page.target() method

> Warning: This API is now obsolete.
>
> Use [Page.createCDPSession()](./puppeteer.page.createcdpsession.md) directly for CDP work. To wait for a page opened by this page, listen for [PageEvent.Popup](./puppeteer.pageevent.md#popup).

A target this page was created from.

### Signature

```typescript
class Page {
  abstract target(): Target;
}
```

**Returns:**

[Target](./puppeteer.target.md)
