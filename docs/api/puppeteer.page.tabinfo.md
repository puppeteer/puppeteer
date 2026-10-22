---
sidebar_label: Page.tabInfo
---

# Page.tabInfo() method

Returns information about the browser tab of this page. The result is a snapshot and is not updated when the tab changes.

### Signature

```typescript
class Page {
  abstract tabInfo(): Promise<TabInfo | null>;
}
```

**Returns:**

Promise&lt;[TabInfo](./puppeteer.tabinfo.md) \| null&gt;

`null` if the page is not in a tab strip, for example, in `chrome-headless-shell`. Chrome before M150 does not report tab information, so the method also returns `null` there.
