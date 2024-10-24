---
sidebar_label: BrowserContext.overridePermissions
---

# BrowserContext.overridePermissions() method

Grants this [browser context](./puppeteer.browsercontext.md) the given `permissions` within the given `origin`.

### Signature

```typescript
class BrowserContext {
  abstract overridePermissions(
    origin: string,
    permissions: Permission[],
  ): Promise<void>;
}
```

## Parameters

<table><thead><tr><th>

Parameter

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody><tr><td>

origin

</td><td>

string

</td><td>

The origin to grant permissions to, e.g. "https://example.com".

</td></tr>
<tr><td>

permissions

</td><td>

[Permission](./puppeteer.permission.md)\[\]

</td><td>

An array of permissions to grant. All permissions that are not listed here will be automatically denied.

</td></tr>
</tbody></table>
**Returns:**

Promise&lt;void&gt;

## Example

Overriding permissions in the [default browser context](./puppeteer.browser.defaultbrowsercontext.md):

```ts
const context = browser.defaultBrowserContext();
await context.overridePermissions('https://html5demos.com', ['geolocation']);
```
