---
sidebar_label: Page.isDragInterceptionEnabled
---

# Page.isDragInterceptionEnabled() method

> Warning: This API is now obsolete.
>
> We no longer support intercepting drag payloads. Use the new drag APIs found on [ElementHandle](./puppeteer.elementhandle.md) to drag (or just use the [Page.mouse](./puppeteer.page.md#mouse)).

`true` if drag events are being intercepted, `false` otherwise.

#### Signature:

```typescript
class Page {
  abstract isDragInterceptionEnabled(): boolean;
}
```

**Returns:**

boolean
