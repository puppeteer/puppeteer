---
sidebar_label: Page.target
---

# Page.target() method

> Warning: This API is now obsolete.
>
> To create CDP session use [Page.createCDPSession()](./puppeteer.page.createcdpsession.md) directly. To identify pages spawned by this one, use [PageEvent.Popup](./puppeteer.pageevent.md) event instead.

A target this page was created from.

### Signature

```typescript
class Page {
  abstract target(): Target;
}
```

**Returns:**

[Target](./puppeteer.target.md)
