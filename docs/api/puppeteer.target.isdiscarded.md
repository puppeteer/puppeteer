---
sidebar_label: Target.isDiscarded
---

# Target.isDiscarded() method

Returns `true` if the target is a `"tab"` target and the browser discarded the tab to save memory.

### Signature

```typescript
class Target {
  isDiscarded(): boolean;
}
```

**Returns:**

boolean

## Remarks

A discarded tab has no page target. [Target.page()](./puppeteer.target.page.md) returns `null` for it, [Target.asPage()](./puppeteer.target.aspage.md) throws, and [Browser.pages()](./puppeteer.browser.pages.md) does not include it. When the tab loads again, for example when the user selects it, the tab gets a new page target and Puppeteer emits `targetchanged` for the tab target.

A [Page](./puppeteer.page.md) that is open when its tab is discarded closes.

Only supported for Chrome and the CDP protocol. With WebDriver BiDi, returns `false`.
