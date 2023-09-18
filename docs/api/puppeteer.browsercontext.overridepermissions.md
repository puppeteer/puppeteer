---
sidebar_label: BrowserContext.overridePermissions
---

# BrowserContext.overridePermissions() method

Grants this [browser context](./puppeteer.browsercontext.md) the given `permissions` within the given `origin`.

#### Signature:

```typescript
class BrowserContext {
  overridePermissions(origin: string, permissions: Permission[]): Promise<void>;
}
```

## Parameters

| Parameter   | Type                                        | Description                                                                                              |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| origin      | string                                      | The origin to grant permissions to, e.g. "https://example.com".                                          |
| permissions | [Permission](./puppeteer.permission.md)\[\] | An array of permissions to grant. All permissions that are not listed here will be automatically denied. |

**Returns:**

Promise&lt;void&gt;

## Example

Overriding permissions in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md):

```ts
const context = browser.defaultBrowserContext();
await context.overridePermissions('https://html5demos.com', ['geolocation']);
```
