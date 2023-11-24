---
sidebar_label: BrowserContext.clearPermissionOverrides
---

# BrowserContext.clearPermissionOverrides() method

Clears all permission overrides for this [browser context](./puppeteer.browsercontext.md).

#### Signature:

```typescript
class BrowserContext &#123;abstract clearPermissionOverrides(): Promise<void>;&#125;
```

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
