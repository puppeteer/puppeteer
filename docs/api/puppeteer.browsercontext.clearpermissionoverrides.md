---
sidebar_label: BrowserContext.clearPermissionOverrides
---

# BrowserContext.clearPermissionOverrides() method

### Signature:

```typescript
class BrowserContext {
  abstract clearPermissionOverrides(): Promise<void>;
}
```

Clears all permission overrides for this [browser context](./puppeteer.browsercontext.md).

**Returns:**

Promise&lt;void&gt;

## Example

Clearing overridden permissions in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md):

```ts
const context = browser.defaultBrowserContext();
context.overridePermissions('https://example.com', ['clipboard-read']);
// do stuff ..
context.clearPermissionOverrides();
```
