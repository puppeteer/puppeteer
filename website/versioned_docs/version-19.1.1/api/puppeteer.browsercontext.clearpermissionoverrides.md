---
sidebar_label: BrowserContext.clearPermissionOverrides
---

# BrowserContext.clearPermissionOverrides() method

Clears all permission overrides for the browser context.

#### Signature:

```typescript
class BrowserContext {
  clearPermissionOverrides(): Promise<void>;
}
```

**Returns:**

Promise&lt;void&gt;

## Example

```ts
const context = browser.defaultBrowserContext();
context.overridePermissions('https://example.com', ['clipboard-read']);
// do stuff ..
context.clearPermissionOverrides();
```
